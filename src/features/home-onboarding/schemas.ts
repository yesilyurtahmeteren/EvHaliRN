// Ev Oluştur / Eve Katıl form kuralları (Flutter CreateHomeScreen ile aynı):
// ev adı kırpılır, boşsa hiçbir şey yapılmaz, en fazla 60 karakter
// (firestore.rules da 60'ı sınırlıyor). Davet kodunda yalnızca boş olmama
// kontrol edilir; geçerliliğine Firestore karar verir.
import { z } from 'zod';

import { homeNameSchema } from '@/shared/schemas';

export { homeNameMaxLength } from '@/shared/schemas';

export const createHomeFormSchema = z.object({ name: homeNameSchema });
export type CreateHomeForm = z.input<typeof createHomeFormSchema>;

export const joinHomeFormSchema = z.object({
  code: z.string().refine((value) => value.replace(/\s+/g, '').length > 0),
});
export type JoinHomeForm = z.input<typeof joinHomeFormSchema>;
