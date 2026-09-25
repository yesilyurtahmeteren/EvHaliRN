// Flutter FirestoreService.leaveHome / setNotificationsEnabled / setTextScale.
import { arrayRemove, doc, getFirestore, updateDoc } from '@react-native-firebase/firestore';

// Önce üyelikten çıkılır, sonra users.homeId temizlenir (Flutter ile aynı
// sıra). Kural yalnızca kendi uid'ini çıkarmaya izin veriyor.
export async function leaveHome({ homeId, uid }: { homeId: string; uid: string }): Promise<void> {
  const db = getFirestore();
  await updateDoc(doc(db, 'homes', homeId), { memberIds: arrayRemove(uid) });
  await updateDoc(doc(db, 'users', uid), { homeId: null });
}

export function setNotificationsEnabled({
  uid,
  enabled,
}: {
  uid: string;
  enabled: boolean;
}): Promise<void> {
  return updateDoc(doc(getFirestore(), 'users', uid), { notificationsEnabled: enabled });
}

export function setTextScale({
  uid,
  textScale,
}: {
  uid: string;
  textScale: number;
}): Promise<void> {
  return updateDoc(doc(getFirestore(), 'users', uid), { textScale });
}
