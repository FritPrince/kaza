import { z } from 'zod';
import { INTERIOR_STYLES } from '../constants';
import { idSchema } from './common';

export const generationStatusSchema = z.enum(['pending', 'processing', 'done', 'failed']);
export type GenerationStatus = z.infer<typeof generationStatusSchema>;

/**
 * Structured prompt produced by the conversational agent and consumed by the
 * ImageProvider abstraction (§7.4). This is the contract between the Claude
 * agent output and the image generation pipeline.
 */
export const structuredPromptSchema = z.object({
  style: z.enum(INTERIOR_STYLES),
  palette: z.array(z.string()).max(6),
  budgetLevel: z.enum(['low', 'medium', 'high']),
  keepElements: z.array(z.string()).max(10),
  instructions: z.string().max(2000),
});
export type StructuredPrompt = z.infer<typeof structuredPromptSchema>;

export const generationSchema = z.object({
  id: idSchema,
  roomId: idSchema,
  version: z.number().int().positive(),
  parentGenerationId: idSchema.nullable(),
  structuredPrompt: structuredPromptSchema,
  imageUrl: z.string().url().nullable(),
  status: generationStatusSchema,
  failureReason: z.string().nullable(),
  costUsd: z.number().nonnegative().nullable(),
  createdAt: z.string().datetime(),
});
export type Generation = z.infer<typeof generationSchema>;

export const requestGenerationSchema = z.object({
  roomId: idSchema,
  structuredPrompt: structuredPromptSchema,
  /** 1 to 3 variants depending on plan (§B4). Server re-validates against the user's plan. */
  variants: z.number().int().min(1).max(3).default(1),
  /** Set when iterating on an existing render (§B5). */
  parentGenerationId: idSchema.optional(),
});
export type RequestGenerationInput = z.infer<typeof requestGenerationSchema>;
