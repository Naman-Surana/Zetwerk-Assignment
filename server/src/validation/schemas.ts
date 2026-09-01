import { z } from 'zod';

export const TransferSchema = z.object({
  toAccountNumber: z.string().min(1, "Invalid receiver account number"),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().max(255).optional(),
  idempotencyKey: z.string().optional()
});
