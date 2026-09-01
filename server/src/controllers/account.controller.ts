import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/account.service';
import { CreateAccountSchema } from '../validation/schemas';

export class AccountController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = CreateAccountSchema.parse(req.body);
      const account = await AccountService.createAccount(data.holderName, data.email, data.initialBalance);
      res.status(201).json(account);
    } catch (err) {
      next(err);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await AccountService.getAllAccounts();
      res.status(200).json(accounts);
    } catch (err) {
      next(err);
    }
  }

  static async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await AccountService.getAccountById(req.params.id as string);
      res.status(200).json(account);
    } catch (err) {
      next(err);
    }
  }

  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await AccountService.getAccountTransactions(req.params.id as string);
      res.status(200).json(transactions);
    } catch (err) {
      next(err);
    }
  }
}
