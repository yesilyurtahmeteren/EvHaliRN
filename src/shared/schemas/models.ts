// Flutter lib/models/*.dart karşılığı. Her şema Firestore'dan okunan ham
// doküman verisine doküman ID'si eklenmiş nesneyi doğrular ({...data, id}).
// Varsayılanlar Flutter fromMap() ile birebir aynı; bilinmeyen alanlar
// (pushTokens, notified, createdAt, lastUsedAt) Flutter'da da okunmuyordu.
import { z } from 'zod';

import { nullableString, nullableTimestamp, timestampOrNow, withDefault } from './common';
import { itemCategorySchema, itemUnitSchema, type ItemStatus } from './enums';

// users/{uid}
export const appUserSchema = z.object({
  uid: z.string(),
  displayName: withDefault(z.string(), ''),
  photoUrl: nullableString,
  homeId: nullableString,
  notificationsEnabled: withDefault(z.boolean(), true),
  textScale: withDefault(z.number(), 1.0),
});
export type AppUser = z.infer<typeof appUserSchema>;

// homes/{homeId}
export const homeSchema = z.object({
  id: z.string(),
  name: withDefault(z.string(), ''),
  memberIds: withDefault(z.array(z.string()), []),
  inviteCode: withDefault(z.string(), ''),
});
export type Home = z.infer<typeof homeSchema>;

// homes/{homeId}/items/{itemId}
export const itemSchema = z.object({
  id: z.string(),
  name: withDefault(z.string(), ''),
  // Flutter: 'bought' değilse (bilinmeyen değer dahil) needed.
  status: z.unknown().transform((value): ItemStatus => (value === 'bought' ? 'bought' : 'needed')),
  addedBy: withDefault(z.string(), ''),
  addedAt: timestampOrNow,
  boughtBy: nullableString,
  boughtAt: nullableTimestamp,
  // Eski kayıtlarda quantity/note/unit/urgent yok.
  quantity: withDefault(z.number().int(), 1),
  note: nullableString,
  // Flutter bilinmeyen birimi olduğu gibi tutup etiketi "Adet"e düşürüyordu;
  // kurallar zaten listeyle sınırlı, burada doğrudan adet'e düşülüyor.
  unit: itemUnitSchema.catch('adet'),
  urgent: withDefault(z.boolean(), false),
});
export type Item = z.infer<typeof itemSchema>;

// homes/{homeId}/catalog/{normalizedName}
export const catalogItemSchema = z.object({
  id: z.string(),
  name: withDefault(z.string(), ''),
  count: withDefault(z.number().int(), 0),
  // Listede olmayan bir değer "kategori yok" sayılır (etiketi Diğer olur).
  category: itemCategorySchema.nullable().catch(null),
});
export type CatalogItem = z.infer<typeof catalogItemSchema>;

// invites/{code} - Flutter'da model sınıfı yoktu, yalnızca homeId okunuyordu.
export const inviteSchema = z.object({
  code: z.string(),
  homeId: z.string().min(1),
  createdAt: nullableTimestamp,
});
export type Invite = z.infer<typeof inviteSchema>;
