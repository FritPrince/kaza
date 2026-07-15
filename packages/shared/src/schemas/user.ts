import { z } from 'zod';
import { INTERIOR_STYLES } from '../constants';
import { currencySchema, idSchema, languageSchema } from './common';

export const subscriptionPlanSchema = z.enum(['free', 'premium']);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const userSchema = z.object({
  id: idSchema,
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  displayName: z.string().nullable(),
  language: languageSchema,
  country: z.string().length(2).nullable(),
  currency: currencySchema,
  credits: z.number().int().nonnegative(),
  plan: subscriptionPlanSchema,
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof userSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  language: languageSchema.optional(),
  country: z.string().length(2).optional(),
  currency: currencySchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Taste quiz swipe: one image liked or disliked (§A2). */
export const tasteSwipeSchema = z.object({
  imageId: idSchema,
  liked: z.boolean(),
});

export const submitTasteQuizSchema = z.object({
  swipes: z.array(tasteSwipeSchema).min(1).max(50),
});
export type SubmitTasteQuizInput = z.infer<typeof submitTasteQuizSchema>;

export const tasteProfileSchema = z.object({
  userId: idSchema,
  favoriteStyles: z.array(z.enum(INTERIOR_STYLES)),
  palette: z.array(z.string()),
  budgetLevel: z.enum(['low', 'medium', 'high']).nullable(),
  updatedAt: z.string().datetime(),
});
export type TasteProfile = z.infer<typeof tasteProfileSchema>;
