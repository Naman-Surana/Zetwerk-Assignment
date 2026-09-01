import { prisma } from '../db';
import { Prisma } from '@prisma/client';
import { NotFoundError } from '../utils/errors';

export class AccountService {
  static async getAccountByUserId(userId: string) {
    const account = await prisma.account.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true } } }
    });
    if (!account) throw new NotFoundError('Account not found');
    return account;
  }

  static async getAccountTransactionsByUserId(userId: string, counterpartyUserId?: string) {
    const account = await this.getAccountByUserId(userId);
    const id = account.id;

    const whereClause: Prisma.TransactionWhereInput = {
      OR: [
        { fromAccountId: id },
        { toAccountId: id }
      ]
    };

    if (counterpartyUserId) {
      whereClause.AND = [
        {
          OR: [
            { fromAccount: { userId: counterpartyUserId } },
            { toAccount: { userId: counterpartyUserId } }
          ]
        }
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        fromAccount: { select: { accountNumber: true, user: { select: { name: true } } } },
        toAccount: { select: { accountNumber: true, user: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return transactions.map(tx => {
      const isDebit = tx.fromAccountId === id;
      return {
        id: tx.id,
        direction: isDebit ? 'DEBIT' : 'CREDIT',
        counterpartyAccountNumber: isDebit ? tx.toAccount.accountNumber : tx.fromAccount.accountNumber,
        counterpartyName: isDebit ? tx.toAccount.user.name : tx.fromAccount.user.name,
        amount: tx.amount,
        description: tx.description,
        status: tx.status,
        createdAt: tx.createdAt
      };
    });
  }
}
