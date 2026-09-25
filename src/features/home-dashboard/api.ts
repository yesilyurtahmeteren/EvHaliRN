// Flutter FirestoreService.renameHome / regenerateInviteCode.
import {
  deleteDoc,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';

import { generateInviteCode } from '@/shared/lib/invite-code';

export function renameHome({ homeId, name }: { homeId: string; name: string }): Promise<void> {
  return updateDoc(doc(getFirestore(), 'homes', homeId), { name });
}

// Yeni davet oluşturulur, evdeki kod güncellenir, eski davet silinir (Flutter
// ile aynı sıra: yeni kod çalışmadan eskisi kaybolmaz). Faz 2/3'te oluşturulan
// evlerde kod hiç olmayabilir; o zaman silinecek bir şey yok.
export async function regenerateInviteCode({
  homeId,
  oldCode,
}: {
  homeId: string;
  oldCode: string;
}): Promise<string> {
  const db = getFirestore();
  const newCode = generateInviteCode();

  await setDoc(doc(db, 'invites', newCode), { homeId, createdAt: serverTimestamp() });
  await updateDoc(doc(db, 'homes', homeId), { inviteCode: newCode });
  if (oldCode.length > 0) {
    await deleteDoc(doc(db, 'invites', oldCode));
  }
  return newCode;
}
