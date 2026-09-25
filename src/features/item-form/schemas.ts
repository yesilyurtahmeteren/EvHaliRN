// Ürün formu kuralları: Flutter ItemFormSheet + firestore.rules ile aynı
// sınırlar (ad 1-60, miktar 1-99, not <= 100, birim ve kategori sabit liste).
import { z } from 'zod';

import { itemCategorySchema, itemUnitSchema } from '@/shared/schemas';

export const itemNameMaxLength = 60;
export const noteMaxLength = 100;
export const quantityMin = 1;
export const quantityMax = 99;

export const itemFormSchema = z.object({
  name: z.string().trim().min(1).max(itemNameMaxLength),
  quantity: z.number().int().min(quantityMin).max(quantityMax),
  unit: itemUnitSchema,
  // Boş not yazılmaz, null olur.
  note: z
    .string()
    .trim()
    .max(noteMaxLength)
    .transform((value) => (value.length === 0 ? null : value)),
  category: itemCategorySchema.nullable(),
  urgent: z.boolean(),
});

export type ItemFormInput = z.input<typeof itemFormSchema>;
export type ItemFormValues = z.output<typeof itemFormSchema>;
