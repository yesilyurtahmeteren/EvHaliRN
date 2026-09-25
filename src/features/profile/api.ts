// Profil işlemleri: evden ayrılma, bildirim tercihleri, büyük yazı.
import {
  arrayRemove,
  deleteField,
  doc,
  getFirestore,
  updateDoc,
} from '@react-native-firebase/firestore';

// Önce üyelikten (ve varsa rol kaydından) çıkılır, sonra users.homeId
// temizlenir. Kural yalnızca kendi uid'ini çıkarmaya izin veriyor;
// yönetici, başka üyeler kalıyorsa önce yöneticiliği devretmeli (kural da
// bunu zorluyor, arayüz önceden uyarıyor).
export async function leaveHome({
  homeId,
  uid,
  hasRoles,
}: {
  homeId: string;
  uid: string;
  hasRoles: boolean;
}): Promise<void> {
  const db = getFirestore();
  await updateDoc(
    doc(db, 'homes', homeId),
    hasRoles
      ? { memberIds: arrayRemove(uid), [`roles.${uid}`]: deleteField() }
      : { memberIds: arrayRemove(uid) },
  );
  await updateDoc(doc(db, 'users', uid), { homeId: null });
}

export type NotificationPref = 'notifyAdded' | 'notifyBought';

export function setNotificationPref({
  uid,
  pref,
  enabled,
}: {
  uid: string;
  pref: NotificationPref;
  enabled: boolean;
}): Promise<void> {
  return updateDoc(doc(getFirestore(), 'users', uid), { [pref]: enabled });
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
