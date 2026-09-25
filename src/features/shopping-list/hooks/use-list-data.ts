import { collection, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';

import { liveQueryOptions, type Subscribe } from '@/shared/lib/firebase/live-query';
import { parseCategory, type ItemCategory } from '@/shared/schemas';

export type CategoriesByName = ReadonlyMap<string, ItemCategory | null>;

export const catalogCategoriesKey = (homeId: string) =>
  ['homes', homeId, 'catalog', 'categories'] as const;

// Normalize ad (doküman ID'si) -> bölüm. Eski 10'lu değerler 4'lüye çevrilir.
function subscribeCatalogCategories(homeId: string): Subscribe<CategoriesByName> {
  return (onNext, onError) =>
    onSnapshot(
      collection(getFirestore(), 'homes', homeId, 'catalog'),
      (snapshot) => {
        const map = new Map<string, ItemCategory | null>();
        snapshot.docs.forEach((d) => map.set(d.id, parseCategory(d.data().category)));
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
