// Sayıdan sonra gelen iyelik eki: "%82'si", "%50'si", "%60'ı", "%100'ü".
// Ek, sayının okunuşundaki son kelimeye göre değişir (ünlü uyumu).
const units = ['ı', 'i', 'si', 'ü', 'ü', 'i', 'sı', 'si', 'i', 'u'] as const; // sıfır..dokuz
const tens = ['', 'u', 'si', 'u', 'ı', 'si', 'ı', 'i', 'i', 'ı'] as const; // on..doksan

export function possessiveSuffix(n: number): string {
  const value = Math.abs(Math.round(n));
  if (value === 0) {
    return units[0];
  }
  if (value % 10 !== 0) {
    return units[value % 10];
  }
  if (value % 100 !== 0) {
    return tens[(value % 100) / 10];
  }
  if (value % 1000 !== 0) {
    return 'ü'; // yüz
  }
  return 'i'; // bin
}
