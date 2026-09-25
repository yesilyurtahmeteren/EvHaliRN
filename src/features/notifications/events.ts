// Bildirimler ekranı (homes/{homeId}/events). Kayıtları Cloudflare Worker
// yazar ('added', 'bought', 'reminder', 'weekly'); 'joined' kaydını katılan
// kişinin kendisi yazar. Kullanıcı yalnızca kendini readBy'a ekleyebilir.
import {
  arrayUnion,
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useRequiredUser } from '@/features/auth/store';
import { liveQueryOptions, type Subscribe } from '@/shared/lib/firebase/live-query';
import { homeEventSchema, type HomeEvent } from '@/shared/schemas';

// Worker 14 günden eskileri siler; ekranda son 7 gün.
const windowMs = 7 * 24 * 60 * 60 * 1000;

export const eventsKey = (homeId: string) => ['homes', homeId, 'events'] as const;

function subscribeEvents(homeId: string): Subscribe<HomeEvent[]> {
  return (onNext, onError) =>
    onSnapshot(
      query(
        collection(getFirestore(), 'homes', homeId, 'events'),
        where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - windowMs))),
        orderBy('createdAt', 'desc'),
        limit(60),
      ),
      (snapshot) => {
        // Tanınmayan tür (ileride eklenebilir) sessizce atlanır; ekranın
        // tamamını hataya düşürmesin.
        const events: HomeEvent[] = [];
        snapshot.docs.forEach((d) => {
          const parsed = homeEventSchema.safeParse({ ...d.data(), id: d.id });
          if (parsed.success) {
            events.push(parsed.data);
          }
        });
        onNext(events);
      },
      onError,
    );
}

// Kendi eylemlerim listede görünmez (ekleyen/alan kişiye kendi bildirimi
// gitmediği gibi).
export function useHomeEvents(homeId: string) {
  const { uid } = useRequiredUser();
  const result = useQuery(
    liveQueryOptions<HomeEvent[], ReturnType<typeof eventsKey>>(
      eventsKey(homeId),
      subscribeEvents(homeId),
    ),
  );
  const events = useMemo(
    () => (result.data ?? []).filter((event) => event.actorId !== uid),
    [result.data, uid],
  );
  const unread = useMemo(
    () => events.filter((event) => !event.readBy.includes(uid)),
    [events, uid],
  );
  return { ...result, events, unread };
}

export function markEventRead({
  homeId,
  eventId,
  uid,
}: {
  homeId: string;
  eventId: string;
  uid: string;
}): Promise<void> {
  return updateDoc(doc(getFirestore(), 'homes', homeId, 'events', eventId), {
    readBy: arrayUnion(uid),
  });
}

export async function markEventsRead({
  homeId,
  eventIds,
  uid,
}: {
  homeId: string;
  eventIds: readonly string[];
  uid: string;
}): Promise<void> {
  if (eventIds.length === 0) {
    return;
  }
  const db = getFirestore();
  const batch = writeBatch(db);
  eventIds.forEach((id) =>
    batch.update(doc(db, 'homes', homeId, 'events', id), { readBy: arrayUnion(uid) }),
  );
  await batch.commit();
}
