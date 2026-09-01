import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import crypto from 'crypto';

export class AccountService {
  static async createAccount(holderName: string, email: string, initialBalance: number) {
    const accountNumber = 'AC' + crypto.randomInt(10000000, 99999999).toString();
    
    return prisma.account.create({
      data: {
        holderName,
        email,
        accountNumber,
        balance: new Prisma.Decimal(initialBalance)
      }
    });
  }

  static async getAllAccounts() {
    return prisma.account.findMany({
      select: {
        id: true,
        accountNumber: true,
        holderName: true,
        balance: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getAccountById(id: string) {
    const account = await prisma.account.findUnique({
      where: { id }
    });
    if (!account) throw new NotFoundError('Account not found');
    return account;
  }

  static async getAccountTransactions(id: string) {
    // Ensure account exists
    await this.getAccountById(id);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAccountId: id },
          { toAccountId: id }
        ]
      },
      include: {
        fromAccount: { select: { accountNumber: true } },
        toAccount: { select: { accountNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return transactions.map(tx => {
      const isDebit = tx.fromAccountId === id;
      return {
        id: tx.id,
        direction: isDebit ? 'DEBIT' : 'CREDIT',
        counterpartyAccountNumber: isDebit ? tx.toAccount.accountNumber : tx.fromAccount.accountNumber,
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt
      };
    });
  }
}
