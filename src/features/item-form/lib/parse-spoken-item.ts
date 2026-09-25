// Sesle söylenen cümleyi ürün alanlarına ayırır: "iki litre süt" ->
// { name: 'Süt', quantity: 2, unit: 'litre' }. Yalnızca baştaki miktar ve
// birim ayrıştırılır; gerisi ürün adıdır. Tanınmayan her şey addır.
import type { ItemUnit } from '@/shared/schemas';

const ones: Record<string, number> = {
  bir: 1,
  iki: 2,
  üç: 3,
  dört: 4,
  beş: 5,
  altı: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
};
const tens: Record<string, number> = {
  on: 10,
  yirmi: 20,
  otuz: 30,
  kırk: 40,
  elli: 50,
  altmış: 60,
  yetmiş: 70,
  seksen: 80,
  doksan: 90,
};
const units: Record<string, ItemUnit> = {
  adet: 'adet',
  tane: 'adet',
  kilo: 'kg',
  kilogram: 'kg',
  kg: 'kg',
  gram: 'g',
  gr: 'g',
  g: 'g',
  litre: 'litre',
  lt: 'litre',
  l: 'litre',
  paket: 'paket',
  kutu: 'kutu',
};

export type SpokenItem = { name: string; quantity?: number; unit?: ItemUnit };

export function parseSpokenItem(transcript: string): SpokenItem {
  const words = transcript.trim().toLocaleLowerCase('tr').split(/\s+/).filter(Boolean);
  let i = 0;
  let quantity: number | undefined;

  if (words[i] !== undefined && /^\d{1,2}$/.test(words[i])) {
    quantity = Number(words[i]);
    i += 1;
  } else {
    let value = 0;
    if (words[i] !== undefined && tens[words[i]] !== undefined) {
      value += tens[words[i]];
      i += 1;
    }
    if (words[i] !== undefined && ones[words[i]] !== undefined) {
      value += ones[words[i]];
      i += 1;
    }
    if (value > 0) {
      quantity = value;
    }
  }

  let unit: ItemUnit | undefined;
  if (words[i] !== undefined && units[words[i]] !== undefined && i + 1 < words.length) {
    unit = units[words[i]];
    i += 1;
  }

  // Yalnızca sayı söylendiyse ("iki") ad olarak kalsın.
  if (i >= words.length) {
    return { name: capitalize(transcript.trim()) };
  }
  const name = capitalize(words.slice(i).join(' '));
  return {
    name,
    quantity: quantity !== undefined && quantity >= 1 && quantity <= 99 ? quantity : undefined,
    unit,
  };
}

function capitalize(text: string): string {
  const [first = '', ...rest] = Array.from(text);
  return first.toLocaleUpperCase('tr') + rest.join('');
}
