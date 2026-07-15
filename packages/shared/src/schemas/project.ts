import { z } from 'zod';
import { ROOM_TYPES } from '../constants';
import { currencySchema, idSchema } from './common';

export const projectTypeSchema = z.enum(['relooking', 'construction']);
export type ProjectType = z.infer<typeof projectTypeSchema>;

export const projectStatusSchema = z.enum(['draft', 'active', 'archived']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectSchema = z.object({
  id: idSchema,
  userId: idSchema,
  type: projectTypeSchema,
  name: z.string(),
  status: projectStatusSchema,
  currency: currencySchema,
  coverImageUrl: z.string().url().nullable(),
  roomCount: z.number().int().nonnegative(),
  totalBudget: z.number().int().nonnegative().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Project = z.infer<typeof projectSchema>;

export const createProjectSchema = z.object({
  type: projectTypeSchema,
  name: z.string().min(1).max(100),
  currency: currencySchema.optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: projectStatusSchema.optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const roomSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  type: z.enum(ROOM_TYPES),
  name: z.string(),
  sourcePhotoUrl: z.string().url().nullable(),
  constraints: z.array(z.string()),
  createdAt: z.string().datetime(),
});
export type Room = z.infer<typeof roomSchema>;

export const createRoomSchema = z.object({
  type: z.enum(ROOM_TYPES),
  name: z.string().min(1).max(80),
  /** Free-text constraints, e.g. "the sofa stays", "kids at home" (§B2). */
  constraints: z.array(z.string().max(200)).max(10).default([]),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
