// Flutter Strings.joinNames karşılığı: "A", "A ve B", "A, B ve C".
// İsme ek eklemediği için ünlü uyumu riski yok. Intl.ListFormat Hermes'te
// güvenilir olmadığı için elle yazıldı.
export function joinNames(names: readonly string[], and: string): string {
  if (names.length === 0) {
    return '';
  }
  if (names.length === 1) {
    return names[0];
  }
  return `${names.slice(0, -1).join(', ')} ${and} ${names[names.length - 1]}`;
}
