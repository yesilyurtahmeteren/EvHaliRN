// Bölümlere göre gruplama (HANDOFF §2.2): 4 sabit bölüm, sıra sabit, boş
// bölüm üretilmez. Bölüm ürünün değil, normalize adının katalog kaydınındır;
// kaydı olmayan ürün "Diğer"e düşer. Her bölümde acil ürünler en üstte, sonra
// yakın zamanda geri alınanlar, sonra en yeni eklenen.
import { normalizeName } from '@/shared/lib/normalize-name';
import { itemCategories, type Item, type ItemCategory } from '@/shared/schemas';

import type { CategoriesByName } from '../hooks/use-list-data';

export type ItemGroup = { category: ItemCategory; items: Item[] };

export function groupByCategory(
  items: readonly Item[],
  categoriesByName: CategoriesByName,
  restoredAt: ReadonlyMap<string, number> = new Map(),
): ItemGroup[] {
  const groups = new Map<ItemCategory, Item[]>();
  for (const item of items) {
    const category = categoriesByName.get(normalizeName(item.name)) ?? 'other';
    const group = groups.get(category);
    if (group === undefined) {
      groups.set(category, [item]);
    } else {
      group.push(item);
    }
  }
  const recency = (item: Item) => restoredAt.get(item.id) ?? item.addedAt.getTime();
  return itemCategories.flatMap((category) => {
    const groupItems = groups.get(category);
    if (groupItems === undefined) {
      return [];
    }
    const sorted = [...groupItems].sort(
      (a, b) => Number(b.urgent) - Number(a.urgent) || recency(b) - recency(a),
    );
    return [{ category, items: sorted }];
  });
}
