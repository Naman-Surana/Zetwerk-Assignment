import { Request, Response } from 'express';
import { prisma } from '../db';
import { AppError } from '../utils/errors';

export const listUsers = async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });
  res.json(users);
};

export const getUserAccount = async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  const account = await prisma.account.findUnique({
    where: { userId }
  });
  res.json(account);
};

export const getUserTransactions = async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404);

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { fromAccount: { userId } },
        { toAccount: { userId } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json(transactions);
};
