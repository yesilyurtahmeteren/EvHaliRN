// Davet kodu kuralları (Flutter CLAUDE.md §4.5, FirestoreService).
import { getRandomValues } from 'expo-crypto';

// 0/O, 1/I/l gibi karıştırılabilir karakterler çıkarıldı.
export const inviteCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const inviteCodeLength = 8;

// Alfabe 32 karakter: bir baytın alt 5 biti (& 31) her karaktere eşit
// olasılık verir, modulo sapması yok. Başka uzunlukta bir alfabeye
// geçilirse bu varsayım bozulur - test bunu kontrol ediyor.
const mask = inviteCodeAlphabet.length - 1;

type RandomSource = (bytes: Uint8Array) => Uint8Array;

export function generateInviteCode(random: RandomSource = getRandomValues): string {
  const bytes = random(new Uint8Array(inviteCodeLength));
  return Array.from(bytes, (byte) => inviteCodeAlphabet[byte & mask]).join('');
}

// Kullanıcının girdiği ya da kopyalayıp yapıştırdığı kod ("ab7k-9tqx",
// "ab7k 9tqx") Firestore'daki doküman ID'sine çevrilir: boşluk ve tireler
// silinir, büyük harf.
export function cleanInviteCode(input: string): string {
  return input.replace(/[\s-]+/g, '').toUpperCase();
}

// Görüntüleme (Main.dc.html "EV-8492-HL" biçimi): "AB7K9TQX" -> "AB7K-9TQX".
// 8 karakter değilse olduğu gibi.
export function formatInviteCode(code: string): string {
  if (code.length !== inviteCodeLength) {
    return code;
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
