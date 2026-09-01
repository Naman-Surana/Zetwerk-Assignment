import { Request, Response, NextFunction } from 'express';
import { TransferService } from '../services/transfer.service';
import { TransferSchema } from '../validation/schemas';

export class TransferController {
  static async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = TransferSchema.parse(req.body);
      const result = await TransferService.transferMoney(
        req.user!.id,
        data.toAccountNumber,
        data.amount,
        data.description,
        data.idempotencyKey
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}
