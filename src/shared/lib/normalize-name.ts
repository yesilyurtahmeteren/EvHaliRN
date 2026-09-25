// Flutter FirestoreService.normalizeName karşılığı. Katalog doküman ID'si
// bu değerdir, bu yüzden Flutter sürümüyle BİREBİR aynı sonucu vermeli:
// "Süt", "süt " ve "SÜT" aynı kayda düşer, Türkçe karakterler korunur.
//
// toLocaleLowerCase('tr') KASITLI olarak kullanılmıyor: Dart toLowerCase()
// dile duyarsız ("I" -> "i", "İ" -> "i̇"), tr yerel ayarı "I" -> "ı" yapar ve
// mevcut katalog ID'leriyle eşleşmezdi (docs/ANALYSIS.md §3.2).
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replaceAll('/', '-');
}
