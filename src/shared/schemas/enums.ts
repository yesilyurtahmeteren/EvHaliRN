// Tasarım handoff'u (2026-09-25) listeleri. firestore.rules aynı listeleri
// doğruluyor; ikisi birlikte güncellenir.
import { z } from 'zod';

// Liste bu sırayla gruplanır (HANDOFF §2.2).
export const itemCategories = ['food', 'clean', 'care', 'other'] as const;
export type ItemCategory = (typeof itemCategories)[number];

// Flutter sürümünün 10'lu listesi -> yeni 4'lü liste. Kurallar geçiş
// döneminde eskileri de kabul ediyor; okurken her zaman yeni değere çevrilir.
const legacyCategories: Record<string, ItemCategory> = {
  fruit_vegetable: 'food',
  dairy_breakfast: 'food',
  meat_deli: 'food',
  bakery: 'food',
  staple: 'food',
  beverage: 'food',
  snack: 'food',
  cleaning: 'clean',
  personal_care: 'care',
};

export function parseCategory(value: unknown): ItemCategory | null {
  if (typeof value !== 'string') {
    return null;
  }
  if ((itemCategories as readonly string[]).includes(value)) {
    return value as ItemCategory;
  }
  return legacyCategories[value] ?? null;
}

export const itemCategorySchema = z.enum(itemCategories);

export const itemUnits = ['adet', 'kg', 'g', 'litre', 'paket', 'kutu'] as const;
export const itemUnitSchema = z.enum(itemUnits);
export type ItemUnit = z.infer<typeof itemUnitSchema>;

export const itemStatuses = ['needed', 'bought'] as const;
export type ItemStatus = (typeof itemStatuses)[number];

// homes.roles değerleri. Haritada olmayan üye 'member'.
export const homeRoles = ['admin', 'member', 'child', 'guest'] as const;
export const homeRoleSchema = z.enum(homeRoles);
export type HomeRole = z.infer<typeof homeRoleSchema>;

// Profil > "Büyük yazı" (tokens.json type.largeTextMultiplier).
export const largeTextScale = 1.14;

// Bildirimler ekranı kayıt türleri (homes/{homeId}/events).
export const eventTypes = ['added', 'bought', 'joined', 'reminder', 'weekly'] as const;
export type EventType = (typeof eventTypes)[number];
