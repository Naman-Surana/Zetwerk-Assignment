import { z } from 'zod';

export const TransferSchema = z.object({
  toAccountNumber: z.string().regex(/^\d{8,17}$/, "Account number must be 8 to 17 digits"),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().max(255).optional(),
  idempotencyKey: z.string().optional()
});
