import { z } from 'zod';
import { idSchema } from './common';

/** RBAC roles for the back-office (§G8). */
export const adminRoleSchema = z.enum(['super-admin', 'support', 'finance', 'moderator']);
export type AdminRole = z.infer<typeof adminRoleSchema>;

export const adminUserSchema = z.object({
  id: idSchema,
  email: z.string().email(),
  displayName: z.string(),
  role: adminRoleSchema,
  twoFactorEnabled: z.boolean(),
  createdAt: z.string().datetime(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).regex(/^\d+$/).optional(),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/** Manual credit adjustment with mandatory reason — audited (§G1, §G8). */
export const adjustCreditsSchema = z.object({
  userId: idSchema,
  delta: z.number().int().refine((v) => v !== 0, 'Delta must be non-zero'),
  reason: z.string().min(5).max(500),
});
export type AdjustCreditsInput = z.infer<typeof adjustCreditsSchema>;

export const suspendUserSchema = z.object({
  userId: idSchema,
  reason: z.string().min(5).max(500),
});
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;

export const auditLogSchema = z.object({
  id: idSchema,
  adminId: idSchema,
  action: z.string(),
  targetEntity: z.string(),
  targetId: z.string().nullable(),
  details: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

/** Revenue & AI cost dashboard payload (§G2). */
export const economicsDashboardSchema = z.object({
  period: z.enum(['7d', '30d', '90d']),
  revenue: z.object({
    subscriptions: z.number(),
    creditPacks: z.number(),
    mobileMoney: z.number(),
    total: z.number(),
  }),
  aiCosts: z.object({
    totalUsd: z.number(),
    perGenerationUsd: z.number(),
    perActiveUserUsd: z.number(),
  }),
  grossMarginPercent: z.number(),
  generationsCount: z.number().int(),
  activeUsers: z.number().int(),
});
export type EconomicsDashboard = z.infer<typeof economicsDashboardSchema>;
