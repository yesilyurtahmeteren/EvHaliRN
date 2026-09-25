// Flutter FirestoreService.createHome / joinHome karşılığı. Yazma sırası ve
// alanlar birebir aynı: firestore.rules bu biçimi bekliyor.
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';

import { cleanInviteCode, generateInviteCode } from '@/shared/lib/invite-code';
import { inviteSchema } from '@/shared/schemas';

export class InvalidInviteCodeError extends Error {
  constructor() {
    super('invalid-code');
    this.name = 'InvalidInviteCodeError';
  }
}

// homes + invites + users.homeId. users.homeId en son yazılır: HomeGate onu
// dinlediği için sekmeler ancak ev ve davet kodu hazır olduğunda açılır.
export async function createHome({ name, uid }: { name: string; uid: string }): Promise<string> {
  const db = getFirestore();
  const homeRef = doc(collection(db, 'homes'));
  const code = generateInviteCode();

  await setDoc(homeRef, {
    name,
    memberIds: [uid],
    inviteCode: code,
    createdAt: serverTimestamp(),
    // Evi kuran yönetici (firestore.rules: roles == {uid: 'admin'}).
    roles: { [uid]: 'admin' },
  });
  await setDoc(doc(db, 'invites', code), {
    homeId: homeRef.id,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'users', uid), { homeId: homeRef.id });

  return homeRef.id;
}

// Kod kullanıcıdan geldiği gibi alınır ("ab7k 9tqx" da olur), burada
// temizlenir. Kod yoksa InvalidInviteCodeError.
export async function joinHome({ code, uid }: { code: string; uid: string }): Promise<string> {
  const db = getFirestore();
  const cleaned = cleanInviteCode(code);
  // Boş ya da '/' içeren bir kod doküman yolunu bozar; zaten geçerli değil.
  if (cleaned.length === 0 || cleaned.includes('/')) {
    throw new InvalidInviteCodeError();
  }

  const snapshot = await getDoc(doc(db, 'invites', cleaned));
  if (!snapshot.exists()) {
    throw new InvalidInviteCodeError();
  }
  const { homeId } = inviteSchema.parse({ ...snapshot.data(), code: cleaned });

  await updateDoc(doc(db, 'homes', homeId), { memberIds: arrayUnion(uid) });
  await updateDoc(doc(db, 'users', uid), { homeId });
  // Bildirimler ekranındaki "evinize katıldı" kaydı. Katılım zaten
  // tamamlandı; bu kayıt yazılamazsa katılımı başarısız saymayız.
  await setDoc(doc(collection(db, 'homes', homeId, 'events')), {
    type: 'joined',
    actorId: uid,
    createdAt: serverTimestamp(),
    readBy: [uid],
  }).catch((error: unknown) => {
    if (__DEV__) {
      console.warn('joined event failed', error);
    }
  });

  return homeId;
}
