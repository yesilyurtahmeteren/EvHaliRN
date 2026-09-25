import { collection, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';

import { liveQueryOptions, type Subscribe } from '@/shared/lib/firebase/live-query';
import { itemCategorySchema, type ItemCategory } from '@/shared/schemas';

import { fetchTopCatalog } from '../api';

export type CategoriesByName = ReadonlyMap<string, ItemCategory | null>;

export const catalogCategoriesKey = (homeId: string) =>
  ['homes', homeId, 'catalog', 'categories'] as const;
export const topCatalogKey = (homeId: string) => ['homes', homeId, 'catalog', 'top'] as const;

// Flutter catalogCategoriesStream: normalize ad (doküman ID'si) -> kategori.
function subscribeCatalogCategories(homeId: string): Subscribe<CategoriesByName> {
  return (onNext, onError) =>
    onSnapshot(
      collection(getFirestore(), 'homes', homeId, 'catalog'),
      (snapshot) => {
        const map = new Map<string, ItemCategory | null>();
        snapshot.docs.forEach((d) => {
          const parsed = itemCategorySchema.safeParse(d.data().category);
          map.set(d.id, parsed.success ? parsed.data : null);
        });
        onNext(map);
      },
      onError,
    );
}

export function useCatalogCategories(homeId: string) {
  return useQuery(
    liveQueryOptions<CategoriesByName, ReturnType<typeof catalogCategoriesKey>>(
      catalogCategoriesKey(homeId),
      subscribeCatalogCategories(homeId),
    ),
  );
}

// Çip sırası oturum içinde DONDURULUR (Flutter CLAUDE.md, Faz 7 adım 4):
// count her eklemede değişir, sıra sürekli oynarsa kas hafızası oluşmaz.
// Bu yüzden canlı dinleyici değil tek okuma; cache'ten hiç düşmez.
export function useFrozenTopCatalog(homeId: string) {
  return useQuery({
    queryKey: topCatalogKey(homeId),
    queryFn: () => fetchTopCatalog(homeId),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
