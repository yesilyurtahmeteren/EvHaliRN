// Flutter lib/theme/member_colors.dart karşılığı. Dart String.hashCode
// platforma özel olduğu için burada belirlenimci djb2 kullanılıyor - aynı
// kişi her cihazda aynı rengi alır ama Flutter sürümündeki tonla aynı
// olmayabilir (bkz. docs/ANALYSIS.md §6).

const light = ['#F4C2CF', '#BCE8D3', '#FBD9A0', '#C7DCEE', '#F3C7AE', '#CBDFC9'] as const;
const dark = ['#B4657A', '#4F8F6D', '#C08B2E', '#5C84A8', '#B5623A', '#4A6B5D'] as const;

export const memberOnLight = '#242D27';
export const memberOnDark = '#FCF9F3';

export function stableHash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function memberColorFor(uid: string, scheme: 'light' | 'dark'): string {
  const palette = scheme === 'dark' ? dark : light;
  return palette[stableHash(uid) % palette.length];
}

export function memberOnColorFor(scheme: 'light' | 'dark'): string {
  return scheme === 'dark' ? memberOnDark : memberOnLight;
}
