// Flutter services/notification_service.dart karşılığı.
//
// Bildirim GÖNDERİMİ burada değil, hiçbir zaman istemcide değil (Flutter
// CLAUDE.md §4.1.4): Cloudflare Worker (cloudflare-worker/) yeni ürünleri
// okuyup OneSignal REST API'siyle gönderiyor; REST anahtarı yalnızca Worker'ın
// secret'larında. Uygulama yalnızca bu cihazın abonelik kimliğini kaydeder.
import { arrayUnion, doc, getFirestore, updateDoc } from '@react-native-firebase/firestore';
import { LogLevel, OneSignal } from 'react-native-onesignal';

// Herkese açık uygulama kimliği (sır değil): telefonun hangi OneSignal
// uygulamasına kaydolacağını söyler, gönderme yetkisi vermez.
const oneSignalAppId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID;

let initialized = false;

// Uygulama açılışında bir kez (Flutter main: NotificationService.initialize).
// Android 13+ bildirim izni burada istenir; reddedilirse uygulama normal
// çalışır, yalnızca bildirim gelmez.
export function initNotifications(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  if (oneSignalAppId === undefined || oneSignalAppId.length === 0) {
    if (__DEV__) {
      console.warn('EXPO_PUBLIC_ONESIGNAL_APP_ID tanımlı değil; bildirimler kapalı.');
    }
    return;
  }
  // Flutter release'te de verbose log açıyordu; burada yalnızca geliştirmede.
  if (__DEV__) {
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  }
  OneSignal.initialize(oneSignalAppId);
  void OneSignal.Notifications.requestPermission(true);
}

// users/{uid}.pushTokens'a bu cihazın OneSignal abonelik kimliği eklenir
// (arrayUnion: aynı kimlik iki kez yazılmaz, diğer cihazlarınki korunur).
export function savePushToken({ uid, token }: { uid: string; token: string }): Promise<void> {
  return updateDoc(doc(getFirestore(), 'users', uid), { pushTokens: arrayUnion(token) });
}

export function getPushSubscriptionId(): Promise<string | null> {
  return OneSignal.User.pushSubscription.getIdAsync();
}

export function onPushSubscriptionChange(listener: (id: string | null) => void): () => void {
  const handler = (event: { current: { id?: string } }) => listener(event.current.id ?? null);
  OneSignal.User.pushSubscription.addEventListener('change', handler);
  return () => OneSignal.User.pushSubscription.removeEventListener('change', handler);
}
