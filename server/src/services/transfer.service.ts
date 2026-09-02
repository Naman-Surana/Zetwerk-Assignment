import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, InsufficientFundsError, AppError } from '../utils/errors';
import crypto from 'crypto';
import { transferQueue } from '../queues/transfer.queue';

export class TransferService {
  static async queueTransfer(userId: string, toAccountNumber: string, amountNum: number, description?: string, idempotencyKey?: string) {
    const amount = new Prisma.Decimal(amountNum);
    
    if (amount.lte(0)) {
      throw new BadRequestError('Amount must be greater than zero', 'VALIDATION_ERROR');
    }

    const fromAccount = await prisma.account.findUnique({ where: { userId } });
    const toAccount = await prisma.account.findUnique({ where: { accountNumber: toAccountNumber } });
    
    if (!fromAccount || !toAccount) {
      throw new NotFoundError('Account not found');
    }

    if (fromAccount.id === toAccount.id) {
      throw new BadRequestError('Cannot transfer to the same account', 'SAME_ACCOUNT_TRANSFER');
    }

    if (fromAccount.balance.lt(amount)) {
      throw new InsufficientFundsError('Account balance is insufficient for this transfer.');
    }

    const key = idempotencyKey || crypto.randomUUID();

    // Check idempotency BEFORE creating pending
    const existing = await prisma.transaction.findUnique({ where: { referenceId: key } });
    if (existing) {
       return {
         transactionId: existing.id,
         status: existing.status,
         amount: existing.amount,
         createdAt: existing.createdAt,
         message: 'Transaction already processed or pending.'
       };
    }

    // Create PENDING transaction
    const transaction = await prisma.transaction.create({
      data: {
        referenceId: key,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount,
        status: "PENDING",
        description: description || null
      }
    });

    // Queue the transfer for background processing
    await transferQueue?.add('processTransfer', {
      userId,
      fromAccountNumber: fromAccount.accountNumber,
      toAccountNumber,
      amountNum,
      description: transaction.description || undefined,
      idempotencyKey: transaction.referenceId,
      transactionId: transaction.id
    });

    return {
      transactionId: transaction.id,
      status: 'PENDING',
      message: 'Transfer is processing in the background.'
    };
  }

  static async verifyOtpAndQueueTransfer(transactionId: string, userId: string, otp: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { fromAccount: true }
    });

    if (!transaction) throw new NotFoundError('Transaction not found');
    if (transaction.fromAccount.userId !== userId) throw new BadRequestError('Unauthorized', 'UNAUTHORIZED');
    if (transaction.status !== 'PENDING_OTP') throw new BadRequestError('Transaction is not pending OTP', 'INVALID_STATE');
    
    if (transaction.otpExpiresAt && transaction.otpExpiresAt < new Date()) {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' }
      });
      throw new BadRequestError('OTP has expired', 'OTP_EXPIRED');
    }

    if (transaction.otpCode !== otp) {
      throw new BadRequestError('Invalid OTP', 'INVALID_OTP');
    }

    // OTP is valid, mark as PENDING and queue it
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'PENDING',
        otpCode: null,
        otpExpiresAt: null
      }
    });

    const { enqueueTransfer } = await import('../queues/transfer.queue');
    await enqueueTransfer({
      userId,
      toAccountNumber: (await prisma.account.findUnique({ where: { id: transaction.toAccountId } }))!.accountNumber,
      amountNum: Number(transaction.amount),
      description: transaction.description || undefined,
      idempotencyKey: transaction.referenceId,
      transactionId: transaction.id
    });

    return {
      transactionId: transaction.id,
      status: 'PENDING',
      message: 'Transfer is processing in the background.'
    };
  }

  static async executeTransfer(userId: string, toAccountNumber: string, amountNum: number, description?: string, idempotencyKey?: string, transactionId?: string) {
    const amount = new Prisma.Decimal(amountNum);
    const key = idempotencyKey || crypto.randomUUID();

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const existing = await tx.transaction.findUnique({ where: { referenceId: key } });
          
          // If transaction exists and is SUCCESS or FAILED, it's already done.
          // If it's PENDING (which it should be if queued), we process it.
          if (existing && existing.status !== 'PENDING') {
            return {
              transactionId: existing.id,
              status: existing.status,
            };
          }

          const fromAccount = await tx.account.findUnique({ where: { userId } });
          const toAccount = await tx.account.findUnique({ where: { accountNumber: toAccountNumber } });
          
          if (!fromAccount || !toAccount) {
            throw new NotFoundError('Account not found');
          }

          const debit = await tx.account.updateMany({
            where: { id: fromAccount.id, balance: { gte: amount } },
            data: { balance: { decrement: amount } },
          });
          
          if (debit.count === 0) {
            throw new InsufficientFundsError('Account balance is insufficient for this transfer.');
          }

          await tx.account.update({
            where: { id: toAccount.id },
            data: { balance: { increment: amount } },
          });

          // Update the existing pending transaction to SUCCESS
          if (transactionId) {
             const transaction = await tx.transaction.update({
               where: { id: transactionId },
               data: { status: 'SUCCESS' }
             });
             return transaction;
          } else {
             // Fallback if no pending transaction was passed
             const transaction = await tx.transaction.create({
               data: {
                 referenceId: key,
                 fromAccountId: fromAccount.id,
                 toAccountId: toAccount.id,
                 amount,
                 status: "SUCCESS",
                 description: description || null,
               },
             });
             return transaction;
          }
         }, { 
           isolationLevel: "Serializable",
           maxWait: 10000,
           timeout: 20000
         });
      } catch (error: any) {
        if (error.code === 'P2034' || error.code === 'P2028' || error.code === '40001' || error.message.includes('deadlock') || error.message.includes('Serialization failure')) {
          if (attempt === maxRetries) {
            throw new AppError('SERVICE_UNAVAILABLE', 'Server is too busy processing transactions. Please try again in a few moments.', 503);
          }
          await new Promise(resolve => setTimeout(resolve, attempt * 200));
          continue;
        }
        throw error;
      }
    }
  }
}
