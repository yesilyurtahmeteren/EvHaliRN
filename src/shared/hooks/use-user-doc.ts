// users/{uid} canlı dokümanı. Flutter'da HomeGate (homeId), EvHaliApp
// (textScale) ve Profil (notificationsEnabled) aynı dokümanı ayrı ayrı
// dinliyordu; burada tek sorgu, tüm tüketiciler aynı cache'i paylaşıyor.
import { doc, getFirestore } from '@react-native-firebase/firestore';
import { useQuery } from '@tanstack/react-query';

import { useRequiredUser } from '@/features/auth/store';
import { liveQueryOptions } from '@/shared/lib/firebase/live-query';
import { subscribeDoc } from '@/shared/lib/firebase/subscribe';
import { appUserSchema, type AppUser } from '@/shared/schemas';

export const userDocKey = (uid: string) => ['users', uid] as const;

export function userDocQueryOptions(uid: string) {
  return liveQueryOptions<AppUser | null, ReturnType<typeof userDocKey>>(
    userDocKey(uid),
    subscribeDoc(doc(getFirestore(), 'users', uid), (id, data) =>
      appUserSchema.parse({ ...data, uid: id }),
    ),
  );
}

export function useUserDoc() {
  const { uid } = useRequiredUser();
  return useQuery(userDocQueryOptions(uid));
}
