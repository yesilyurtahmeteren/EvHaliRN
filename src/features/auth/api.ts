// Flutter services/auth_service.dart karşılığı.
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from '@react-native-firebase/auth';
import { doc, getDoc, getFirestore, setDoc, updateDoc } from '@react-native-firebase/firestore';
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

// Kullanıcı hesap seçiciyi kapatırsa 'cancelled' döner, hata sayılmaz
// (Flutter'da istisna fırlatılıp "Giriş yapılamadı" gösteriliyordu).
export async function signInWithGoogle(): Promise<SignInResult> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return 'cancelled';
    }
    throw error;
  }
  if (!isSuccessResponse(response)) {
    return 'cancelled';
  }

  const { accessToken } = await GoogleSignin.getTokens();
  const credential = GoogleAuthProvider.credential(response.data.idToken, accessToken);
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
