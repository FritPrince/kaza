import { z } from 'zod';
import { languageSchema } from './common';

/** E.164 phone number, e.g. +22990011223. */
export const phoneSchema = z.string().regex(/^\+[1-9]\d{6,14}$/, 'Invalid E.164 phone number');

export const requestOtpSchema = z.object({
  phone: phoneSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6).regex(/^\d+$/),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const emailSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  language: languageSchema.default('fr'),
});
export type EmailSignupInput = z.infer<typeof emailSignupSchema>;

export const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;

export const oauthLoginSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1),
});
export type OauthLoginInput = z.infer<typeof oauthLoginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof authTokensSchema>;
