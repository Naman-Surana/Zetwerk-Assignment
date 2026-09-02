import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/account.service';

export class AccountController {
  static async getMyAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await AccountService.getAccountByUserId(req.user!.id);
      res.status(200).json(account);
    } catch (err) {
      next(err);
    }
  }

  static async getMyTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const counterpartyId = req.query.counterpartyId as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await AccountService.getAccountTransactionsByUserId(req.user!.id, counterpartyId, page, limit);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
