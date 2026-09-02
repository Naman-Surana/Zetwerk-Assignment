import { Request, Response, NextFunction } from 'express';
import { TransferService } from '../services/transfer.service';
import { TransferSchema } from '../validation/schemas';

export class TransferController {
  static async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = TransferSchema.parse(req.body);
      const result = await TransferService.queueTransfer(
        req.user!.id,
        data.toAccountNumber,
        data.amount,
        data.description,
        data.idempotencyKey
      );
      res.status(202).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const transactionId = req.params.id as string;
      const { otp } = req.body;
      
      if (!otp) {
        return res.status(400).json({ error: { message: 'OTP is required' } });
      }

      const result = await TransferService.verifyOtpAndQueueTransfer(
        transactionId,
        req.user!.id,
        otp
      );
      
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
