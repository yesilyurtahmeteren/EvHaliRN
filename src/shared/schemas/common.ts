// Firestore dokümanlarını okurken kullanılan ortak parçalar. Flutter
// modellerindeki `map['x'] as T? ?? varsayılan` deseninin karşılığı: alan
// yoksa ya da null ise varsayılan değer, türü yanlışsa hata (Flutter'da da
// yanlış tür cast hatası fırlatıyordu).
import { z } from 'zod';

// RNFB Timestamp sınıfını import etmeden (testlerde native modül yok)
// yalnızca toDate() taşıyan her nesneyi kabul eder.
type TimestampLike = { toDate(): Date };

const timestampLike = z.custom<TimestampLike>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Partial<TimestampLike>).toDate === 'function',
  { message: 'Expected a Firestore Timestamp' },
);

export function withDefault<T extends z.ZodType>(schema: T, fallback: z.output<T>) {
  return schema.nullish().transform((value) => value ?? fallback);
}

// Gönderilmeyi bekleyen yazmalarda serverTimestamp() alanları null okunur.
export const nullableTimestamp = timestampLike
  .nullish()
  .transform((value) => value?.toDate() ?? null);

// Flutter Item.addedAt: null ise DateTime.now().
export const timestampOrNow = timestampLike
  .nullish()
  .transform((value) => value?.toDate() ?? new Date());

export const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null);
