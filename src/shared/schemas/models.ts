// Firestore'dan okunan ham doküman verisine doküman ID'si eklenmiş nesneleri
// doğrular ({...data, id}). Eski (Flutter) kayıtlarda olmayan alanlar
// varsayılana düşer.
import { z } from 'zod';

import { nullableString, nullableTimestamp, timestampOrNow, withDefault } from './common';
import {
  eventTypes,
  homeRoleSchema,
  itemUnitSchema,
  parseCategory,
  type EventType,
  type HomeRole,
  type ItemStatus,
} from './enums';

// users/{uid}
export const appUserSchema = z.object({
  uid: z.string(),
  displayName: withDefault(z.string(), ''),
  photoUrl: nullableString,
  homeId: nullableString,
  // Eski tek anahtar; yeni iki tercih yoksa bunun değeri geçerli.
  notificationsEnabled: withDefault(z.boolean(), true),
  notifyAdded: z.boolean().nullish(),
  notifyBought: z.boolean().nullish(),
  textScale: withDefault(z.number(), 1.0),
});
export type AppUser = z.infer<typeof appUserSchema>;

export function wantsAddedPush(user: AppUser): boolean {
  return user.notifyAdded ?? user.notificationsEnabled;
}

export function wantsBoughtPush(user: AppUser): boolean {
  return user.notifyBought ?? user.notificationsEnabled;
}

// homes/{homeId}
export const homeSchema = z.object({
  id: z.string(),
  name: withDefault(z.string(), ''),
  memberIds: withDefault(z.array(z.string()), []),
  inviteCode: withDefault(z.string(), ''),
  // null: rol haritası hiç yazılmamış eski ev (kurallar memberIds[0]'ı
  // yönetici sayıyor).
  roles: z
    .record(z.string(), homeRoleSchema.catch('member'))
    .nullish()
    .transform((value) => value ?? null),
});
export type Home = z.infer<typeof homeSchema>;

// firestore.rules roleIn / isAdminIn ile aynı mantık.
export function roleOf(home: Home, uid: string): HomeRole {
  if (home.roles === null) {
    return home.memberIds[0] === uid ? 'admin' : 'member';
  }
  return home.roles[uid] ?? 'member';
}

// homes/{homeId}/items/{itemId}
export const itemSchema = z.object({
  id: z.string(),
  name: withDefault(z.string(), ''),
  // 'bought' değilse (bilinmeyen değer dahil) needed.
  status: z.unknown().transform((value): ItemStatus => (value === 'bought' ? 'bought' : 'needed')),
  addedBy: withDefault(z.string(), ''),
  addedAt: timestampOrNow,
  boughtBy: nullableString,
  boughtAt: nullableTimestamp,
  quantity: withDefault(z.number().int(), 1),
  note: nullableString,
  // Listede olmayan birim (eski 'demet' dahil) adet'e düşer.
  unit: itemUnitSchema.catch('adet'),
  urgent: withDefault(z.boolean(), false),
});
export type Item = z.infer<typeof itemSchema>;

// homes/{homeId}/catalog/{normalizedName}
export const catalogItemSchema = z.object({
  id: z.string(),
  name: withDefault(z.string(), ''),
  count: withDefault(z.number().int(), 0),
  // Eski 10'lu değerler yeni 4'lüye çevrilir; tanınmayan "kategori yok".
  category: z.unknown().optional().transform(parseCategory),
});
export type CatalogItem = z.infer<typeof catalogItemSchema>;

// invites/{code}
export const inviteSchema = z.object({
  code: z.string(),
  homeId: z.string().min(1),
  createdAt: nullableTimestamp,
});
export type Invite = z.infer<typeof inviteSchema>;

// homes/{homeId}/events/{eventId} - Bildirimler ekranı. Bilinmeyen tür
// okunmaz (null döner, listeden düşer).
export const homeEventSchema = z.object({
  id: z.string(),
  type: z.enum(eventTypes),
  actorId: nullableString,
  count: withDefault(z.number().int(), 1),
  itemNames: withDefault(z.array(z.string()), []),
  createdAt: timestampOrNow,
  readBy: withDefault(z.array(z.string()), []),
});
export type HomeEvent = z.infer<typeof homeEventSchema> & { type: EventType };
