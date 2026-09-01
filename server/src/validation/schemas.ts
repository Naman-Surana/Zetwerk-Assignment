import { z } from 'zod';

export const CreateAccountSchema = z.object({
  holderName: z.string().min(1, "Holder name is required").max(120),
  email: z.string().email("Invalid email format").max(160),
  initialBalance: z.number().min(0, "Initial balance must be positive")
});

export const TransferSchema = z.object({
  fromAccountId: z.string().uuid("Invalid sender account ID"),
  toAccountId: z.string().uuid("Invalid receiver account ID"),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().max(255).optional(),
  idempotencyKey: z.string().optional()
});
