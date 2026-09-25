// Flutter main.dart: AppCheck.activate(debug | playIntegrity) karşılığı.
// Firestore ve Auth için App Check Console'da zorunlu; bu çağrı ilk
// Firebase isteğinden ÖNCE yapılmalı (kök layout modül yüklenirken).
//
// Geliştirme build'i debug sağlayıcıyı kullanır: ilk açılışta logcat'e bir
// debug token yazar, Firebase Console -> App Check -> Apps'te whitelist'e
// eklenmezse istekler PERMISSION_DENIED alır (Flutter CLAUDE.md, Ortam notları).
import { getApp } from '@react-native-firebase/app';
import { initializeAppCheck } from '@react-native-firebase/app-check';

let initialized = false;

export function initAppCheck(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  initializeAppCheck(getApp(), {
    provider: {
      providerOptions: {
        android: { provider: __DEV__ ? 'debug' : 'playIntegrity' },
      },
    },
    isTokenAutoRefreshEnabled: true,
  });
}
