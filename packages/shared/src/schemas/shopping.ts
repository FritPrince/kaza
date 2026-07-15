import { z } from 'zod';
import { idSchema, priceRangeSchema } from './common';

export const shoppingCategorySchema = z.enum([
  'furniture',
  'lighting',
  'textile',
  'decoration',
  'plants',
  'paint',
  'other',
]);
export type ShoppingCategory = z.infer<typeof shoppingCategorySchema>;

export const shoppingItemSchema = z.object({
  id: idSchema,
  generationId: idSchema,
  name: z.string(),
  category: shoppingCategorySchema,
  priceRange: priceRangeSchema,
  purchaseUrl: z.string().url().nullable(),
});
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;

export const shoppingListSchema = z.object({
  generationId: idSchema,
  items: z.array(shoppingItemSchema),
  totalRange: priceRangeSchema,
});
export type ShoppingList = z.infer<typeof shoppingListSchema>;
