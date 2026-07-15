import { z } from 'zod';
import { currencySchema, idSchema } from './common';

export const transactionTypeSchema = z.enum(['credits', 'subscription']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const paymentChannelSchema = z.enum(['store', 'mobile-money']);
export type PaymentChannel = z.infer<typeof paymentChannelSchema>;

export const transactionStatusSchema = z.enum(['pending', 'completed', 'failed', 'refunded']);
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export const transactionSchema = z.object({
  id: idSchema,
  userId: idSchema,
  type: transactionTypeSchema,
  amount: z.number().int().positive(),
  currency: currencySchema,
  channel: paymentChannelSchema,
  status: transactionStatusSchema,
  creditsGranted: z.number().int().nonnegative().nullable(),
  createdAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof transactionSchema>;

/** Credit pack purchase via Mobile Money web checkout (§F2). */
export const initiateMobileMoneyPaymentSchema = z.object({
  packId: z.string().min(1),
  provider: z.enum(['fedapay', 'kkiapay']),
  phone: z.string(),
});
export type InitiateMobileMoneyPaymentInput = z.infer<typeof initiateMobileMoneyPaymentSchema>;
