// Ürün formu kuralları: firestore.rules ile aynı sınırlar (ad 1-60, miktar
// 1-99, birim ve bölüm sabit liste).
import { z } from 'zod';

import { itemCategorySchema, itemUnitSchema } from '@/shared/schemas';

export const itemNameMaxLength = 60;
export const quantityMin = 1;
export const quantityMax = 99;

export const itemFormSchema = z.object({
  name: z.string().trim().min(1).max(itemNameMaxLength),
  quantity: z.number().int().min(quantityMin).max(quantityMax),
  unit: itemUnitSchema,
  category: itemCategorySchema,
  urgent: z.boolean(),
});

export type ItemFormValues = z.output<typeof itemFormSchema>;

// Main.dc.html ehForm(): 1 adet, Gıda, acil değil.
export const emptyItemForm: ItemFormValues = {
  name: '',
  quantity: 1,
  unit: 'adet',
  category: 'food',
  urgent: false,
};
