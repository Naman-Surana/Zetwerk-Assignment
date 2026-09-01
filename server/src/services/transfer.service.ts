import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { BadRequestError, NotFoundError, InsufficientFundsError, AppError } from '../utils/errors';
import crypto from 'crypto';

export class TransferService {
  static async transferMoney(userId: string, toAccountNumber: string, amountNum: number, description?: string, idempotencyKey?: string) {
    const amount = new Prisma.Decimal(amountNum);
    
    if (amount.lte(0)) {
      throw new BadRequestError('Amount must be greater than zero', 'VALIDATION_ERROR');
    }

    const key = idempotencyKey || crypto.randomUUID();

    return prisma.$transaction(async (tx) => {
      const existing = await tx.transaction.findUnique({ where: { referenceId: key } });
      if (existing) {
        const fromAccount = await tx.account.findUnique({ where: { id: existing.fromAccountId }});
        const toAccount = await tx.account.findUnique({ where: { id: existing.toAccountId }});
        
        if (fromAccount?.userId !== userId) {
          throw new AppError('FORBIDDEN', 'Access denied to this account', 403);
        }

        return {
          transactionId: existing.id,
          status: existing.status,
          amount: existing.amount,
          fromAccount: { id: fromAccount!.id, balance: fromAccount!.balance },
          toAccount: { id: toAccount!.id, balance: toAccount!.balance },
          createdAt: existing.createdAt
        };
      }

      const fromAccount = await tx.account.findUnique({ where: { userId } });
      const toAccount = await tx.account.findUnique({ where: { accountNumber: toAccountNumber } });
      
      if (!fromAccount || !toAccount) {
        throw new NotFoundError('Account not found');
      }

      if (fromAccount.id === toAccount.id) {
        throw new BadRequestError('Cannot transfer to the same account', 'SAME_ACCOUNT_TRANSFER');
      }

      const debit = await tx.account.updateMany({
        where: { id: fromAccount.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      
      if (debit.count === 0) {
        throw new InsufficientFundsError('Account balance is insufficient for this transfer.');
      }

      const updatedTo = await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: amount } },
      });

      const updatedFrom = await tx.account.findUnique({ where: { id: fromAccount.id }});

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

      return {
        transactionId: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        fromAccount: { id: updatedFrom!.id, balance: updatedFrom!.balance },
        toAccount: { id: updatedTo.id, balance: updatedTo.balance },
        createdAt: transaction.createdAt
      };
    }, { isolationLevel: "Serializable" });
  }
}
