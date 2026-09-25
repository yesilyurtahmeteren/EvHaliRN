// Flutter FirestoreService.renameHome / regenerateInviteCode.
import {
  arrayRemove,
  deleteDoc,
  deleteField,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import { generateInviteCode } from '@/shared/lib/invite-code';
import type { HomeRole } from '@/shared/schemas';

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

// Yönetici bir üyenin rolünü değiştirir. Rol haritası tamamıyla yazılır
// (eski evlerde hiç yoksa ilk kez oluşur): kurallar en az bir yöneticinin
// kalmasını ve yalnızca üyelere rol verilmesini doğruluyor.
export function setMemberRoles({
  homeId,
  roles,
}: {
  homeId: string;
  roles: Record<string, HomeRole>;
}): Promise<void> {
  return updateDoc(doc(getFirestore(), 'homes', homeId), { roles });
}

// Yönetici bir üyeyi evden çıkarır. Aynı batch'te çıkarılan kişinin
// users.homeId'si null yapılır (kural getAfter ile artık üye olmadığını
// doğruluyor); böylece o kişinin uygulaması okuyamadığı bir eve bakmaz.
export async function removeMember({
  homeId,
  uid,
  hasRoles,
}: {
  homeId: string;
  uid: string;
  hasRoles: boolean;
}): Promise<void> {
  const db = getFirestore();
  const batch = writeBatch(db);
  batch.update(
    doc(db, 'homes', homeId),
    hasRoles
      ? { memberIds: arrayRemove(uid), [`roles.${uid}`]: deleteField() }
      : { memberIds: arrayRemove(uid) },
  );
  batch.update(doc(db, 'users', uid), { homeId: null });
  await batch.commit();
}
