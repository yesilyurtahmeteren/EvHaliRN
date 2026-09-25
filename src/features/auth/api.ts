// Flutter services/auth_service.dart karşılığı.
import {
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from '@react-native-firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
} from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

let googleConfigured = false;

function configureGoogleSignIn(): void {
  if (googleConfigured) {
    return;
  }
  googleConfigured = true;
  // google-services.json'da oauth_client (web client) yok, bu yüzden idToken
  // gelmeyebilir; Flutter sürümü de bu durumda accessToken ile giriş
  // yapıyordu. Web client ID .env'e eklenirse idToken da kullanılır.
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  GoogleSignin.configure(webClientId ? { webClientId } : {});
}

export type SignInResult = 'success' | 'cancelled';

// Hesap seçiciyi açıp Firebase kimlik bilgisini döndürür; vazgeçilirse null.
async function pickGoogleCredential() {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
  if (!isSuccessResponse(response)) {
    return null;
  }
  const { accessToken } = await GoogleSignin.getTokens();
  return GoogleAuthProvider.credential(response.data.idToken, accessToken);
}

// Kullanıcı hesap seçiciyi kapatırsa 'cancelled' döner, hata sayılmaz
// (Flutter'da istisna fırlatılıp "Giriş yapılamadı" gösteriliyordu).
export async function signInWithGoogle(): Promise<SignInResult> {
  const credential = await pickGoogleCredential();
  if (credential === null) {
    return 'cancelled';
  }
  const { user } = await signInWithCredential(getAuth(), credential);
  await ensureUserDocument(user);
  return 'success';
}

// İlk girişte users/{uid} oluşturulur; sonrakilerde yalnızca Google'dan gelen
// ad ve fotoğraf güncellenir (veri minimizasyonu, Flutter CLAUDE.md §4.1.5).
// homeId'ye dokunulmaz.
async function ensureUserDocument(user: User): Promise<void> {
  const ref = doc(getFirestore(), 'users', user.uid);
  const snapshot = await getDoc(ref);
  const profile = { displayName: user.displayName ?? '', photoUrl: user.photoURL };

  if (!snapshot.exists()) {
    await setDoc(ref, { ...profile, homeId: null });
  } else {
    await updateDoc(ref, profile);
  }
}

export async function signOut(): Promise<void> {
  configureGoogleSignIn();
  // Google oturumu da kapatılır ki bir sonraki girişte hesap seçici açılsın.
  await GoogleSignin.signOut();
  await firebaseSignOut(getAuth());
}

export class ReauthMismatchError extends Error {
  constructor() {
    super('reauth-mismatch');
    this.name = 'ReauthMismatchError';
  }
}

// Hesap silme (Profil > Hesabı sil). Firebase, hesabı silmeden önce yakın
// zamanda giriş ister: kullanıcı Google hesabını bir kez daha seçer. Sonra
// (varsa) evden çıkılır (leave), users/{uid} silinir, en son Firebase Auth
// hesabı silinir. Kullanıcının eklediği ürünler ortak listenin parçası
// olduğu için silinmez; "ekledi" satırında adı görünmez olur.
export async function deleteAccount(leave: () => Promise<void>): Promise<'deleted' | 'cancelled'> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user === null) {
    return 'cancelled';
  }
  configureGoogleSignIn();
  // Seçici her zaman açılsın (sessiz yeniden giriş olmasın).
  await GoogleSignin.signOut();
  const credential = await pickGoogleCredential();
  if (credential === null) {
    return 'cancelled';
  }
  const { user: again } = await reauthenticateWithCredential(user, credential);
  if (again.uid !== user.uid) {
    throw new ReauthMismatchError();
  }

  await leave();
  await deleteDoc(doc(getFirestore(), 'users', user.uid));
  await deleteUser(user);
  await GoogleSignin.revokeAccess().catch(() => undefined);
  await GoogleSignin.signOut().catch(() => undefined);
  return 'deleted';
}
