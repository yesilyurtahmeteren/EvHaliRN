// Flutter list_screen.dart _groupByCategory: sabit kategori sırası (markette
// yürüme sırası), kategorisiz ürün "Diğer"e düşer (listenin sonu), boş grup
// üretilmez. Kategori ürünün değil, normalize adının katalog kaydınındır.
import { normalizeName } from '@/shared/lib/normalize-name';
import { itemCategories, type Item, type ItemCategory } from '@/shared/schemas';

import type { CategoriesByName } from '../hooks/use-list-data';

export type ItemGroup = { category: ItemCategory; items: Item[] };

export function groupByCategory(
  items: readonly Item[],
  categoriesByName: CategoriesByName,
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
  return itemCategories.flatMap((category) => {
    const groupItems = groups.get(category);
    return groupItems === undefined ? [] : [{ category, items: groupItems }];
  });
}

// Firestore'un yerel güncellemesi işaretlenen ürünü sorgudan hemen çıkarır;
// animasyonu bitmemiş ("ayrılan") ürünler listenin sonuna eklenerek görünür
// kalır (Flutter _leavingItems).
export function withLeavingItems(
  items: readonly Item[],
  leaving: ReadonlyMap<string, Item>,
): Item[] {
  const present = new Set(items.map((item) => item.id));
  return [...items, ...[...leaving.values()].filter((item) => !present.has(item.id))];
}
