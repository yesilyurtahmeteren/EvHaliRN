// homes/{homeId}/items: gereken ve alınan ürünler (Flutter neededItemsStream /
// boughtItemsStream, aynı sorgular ve sıralama). Ev sekmesindeki durum kartı
// ve alışveriş listesi paylaşır.
import { collection, getFirestore, orderBy, query, where } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';

import { liveQueryOptions } from '@/shared/lib/firebase/live-query';
import { subscribeQuery, type QueryResult } from '@/shared/lib/firebase/subscribe';
import { itemSchema, type Item, type ItemStatus } from '@/shared/schemas';

export const itemsKey = (homeId: string, status: ItemStatus) =>
  ['homes', homeId, 'items', status] as const;

function itemsQueryOptions(homeId: string, status: ItemStatus) {
  const ref = query(
    collection(getFirestore(), 'homes', homeId, 'items'),
    where('status', '==', status),
    orderBy(status === 'needed' ? 'addedAt' : 'boughtAt', 'desc'),
  );
  return liveQueryOptions<QueryResult<Item>, ReturnType<typeof itemsKey>>(
    itemsKey(homeId, status),
    subscribeQuery(ref, (id, data) => itemSchema.parse({ ...data, id })),
  );
}

export function useNeededItems(homeId: string) {
  return useQuery(itemsQueryOptions(homeId, 'needed'));
}

export function useBoughtItems(homeId: string) {
  return useQuery(itemsQueryOptions(homeId, 'bought'));
}
