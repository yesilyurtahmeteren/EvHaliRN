// Flutter lib/models/item_category.dart ve item_unit.dart karşılığı.
// firestore.rules aynı listeleri doğruluyor; ikisi birlikte güncellenir.
import { z } from 'zod';

// Markette yürüme sırasına yakın; liste gruplaması bu sırayı kullanır.
export const itemCategories = [
  'fruit_vegetable',
  'dairy_breakfast',
  'meat_deli',
  'bakery',
  'staple',
  'beverage',
  'snack',
  'cleaning',
  'personal_care',
  'other',
] as const;

export const itemCategorySchema = z.enum(itemCategories);
export type ItemCategory = z.infer<typeof itemCategorySchema>;

export const itemUnits = ['adet', 'kg', 'paket', 'litre', 'demet'] as const;

export const itemUnitSchema = z.enum(itemUnits);
export type ItemUnit = z.infer<typeof itemUnitSchema>;

export const itemStatuses = ['needed', 'bought'] as const;
export type ItemStatus = (typeof itemStatuses)[number];

// Kullanıcının seçebildiği yazı boyutu çarpanları (Profil ekranı).
// Kural 0.8-1.5 aralığını kabul ediyor.
export const textScaleOptions = [0.9, 1.0, 1.15, 1.3] as const;
