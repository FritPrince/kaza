import { z } from 'zod';
import { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from '../constants';

// Matches Prisma's @default(cuid()) identifiers.
export const idSchema = z.string().cuid();

export const currencySchema = z.enum(SUPPORTED_CURRENCIES);

export const languageSchema = z.enum(SUPPORTED_LANGUAGES);

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Price range in the smallest currency unit is avoided on purpose: amounts are integers in the display currency (FCFA has no cents). */
export const priceRangeSchema = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  currency: currencySchema,
});
export type PriceRange = z.infer<typeof priceRangeSchema>;
