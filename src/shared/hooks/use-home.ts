// homes/{homeId} ve üyeleri. Ev sekmesi ve alışveriş listesi (kim ekledi /
// kim aldı) aynı sorguları paylaşır.
import { doc, getDoc, getFirestore, onSnapshot } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';

import { liveQueryOptions, type Subscribe } from '@/shared/lib/firebase/live-query';
import { subscribeDoc, type DocData } from '@/shared/lib/firebase/subscribe';
import { appUserSchema, homeSchema, type AppUser, type Home } from '@/shared/schemas';

export const homeKey = (homeId: string) => ['homes', homeId] as const;
export const membersKey = (homeId: string) => ['homes', homeId, 'members'] as const;

export function useHome(homeId: string) {
  return useQuery(
    liveQueryOptions<Home | null, ReturnType<typeof homeKey>>(
      homeKey(homeId),
      subscribeDoc(doc(getFirestore(), 'homes', homeId), (id, data) =>
        homeSchema.parse({ ...data, id }),
      ),
    ),
  );
}

// Flutter membersStream: ev dokümanı her değiştiğinde (katılma/ayrılma)
// üyelerin users dokümanları bir kez okunur. Sıra memberIds sırasıdır;
// dokümanı olmayan üye atlanır. Önceki okuma bitmeden yeni bir değişiklik
// gelirse eski sonuç yok sayılır (yarış).
export function subscribeMembers(homeId: string): Subscribe<AppUser[]> {
  return (onNext, onError) => {
    const db = getFirestore();
    let generation = 0;
    return onSnapshot(
      doc(db, 'homes', homeId),
      (snapshot) => {
        const current = ++generation;
        const memberIds = homeSchema.parse({ ...(snapshot.data() ?? {}), id: homeId }).memberIds;
        Promise.all(memberIds.map((uid) => getDoc(doc(db, 'users', uid))))
          .then((snaps) => {
            if (current !== generation) {
              return;
            }
            onNext(
              snaps
                .filter((snap) => snap.exists())
                .map((snap) => appUserSchema.parse({ ...(snap.data() as DocData), uid: snap.id })),
            );
          })
          .catch((error: unknown) => {
            if (current === generation) {
              onError(error instanceof Error ? error : new Error(String(error)));
            }
          });
      },
      onError,
    );
  };
}

export function useMembers(homeId: string) {
  return useQuery(
    liveQueryOptions<AppUser[], ReturnType<typeof membersKey>>(
      membersKey(homeId),
      subscribeMembers(homeId),
    ),
  );
}
