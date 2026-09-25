// Fotoğrafı olmayan üyenin baş harf dairesi (Main.dc.html "Aile Bireyleri"):
// tasarımdaki dört pastel çiftten biri, uid'den belirlenimci seçilir - aynı
// kişi her cihazda aynı rengi alır.
import type { ColorToken } from './colors';

const pairs: readonly (readonly [ColorToken, ColorToken])[] = [
  ['peach', 'peachFg'],
  ['mint', 'mintFg'],
  ['honey', 'honeyFg'],
  ['sky', 'skyFg'],
];

export function stableHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function memberColorsFor(uid: string): readonly [ColorToken, ColorToken] {
  return pairs[stableHash(uid) % pairs.length];
}
