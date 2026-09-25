# Flutter → React Native / Expo Paket Eşlemesi

İşaretler:
- ✅ MIGRATION_TASKS §1 listesinde var
- ❓ Listede **yok**, kurmadan önce onay gerekiyor
- 🔧 Expo Go'da çalışmaz, **development build** gerektirir
- ➖ Karşılığı gerekmiyor

## Flutter pubspec bağımlılıkları

| Flutter paketi | Ne için kullanılıyor | RN / Expo karşılığı | Durum |
|---|---|---|---|
| `firebase_core` | Başlatma | `@react-native-firebase/app` | ❓ 🔧 (Firebase kararı onaylandı, paket listeye eklenmeli) |
| `firebase_auth` | Oturum | `@react-native-firebase/auth` | ❓ 🔧 |
| `cloud_firestore` | Tüm veri + offline | `@react-native-firebase/firestore` | ❓ 🔧 |
| `firebase_app_check` | Play Integrity / debug | `@react-native-firebase/app-check` | ❓ 🔧 |
| `google_sign_in` | Google hesabı seçimi | `@react-native-google-signin/google-signin` (Expo config plugin'i var) | ❓ 🔧 |
| `onesignal_flutter` | Push bildirimi | `react-native-onesignal` + `onesignal-expo-plugin` | ✅ onaylandı (Faz 5) 🔧 |
| `share_plus` | Davet kodu paylaşımı | RN yerleşik `Share` API | ➖ (paket gerekmiyor) |
| `material_ui` | Material widget'ları | NativeWind + kendi bileşenlerimiz | ✅ |
| `motor` | M3 yay animasyonları | `react-native-reanimated` `withSpring` | ✅ |
| `cupertino_icons` | (kullanılmıyor) | — | ➖ |
| `flutter/services` `HapticFeedback` | Seçim/hafif/orta titreşim | `expo-haptics` | ❓ (Expo Go'da çalışır) |
| `flutter/services` `Clipboard` | Davet kodu kopyalama | `expo-clipboard` | ❓ (Expo Go'da çalışır) |
| `dart:math` `Random.secure` | Davet kodu | `expo-crypto` (`getRandomValues`) | ❓ (Expo Go'da çalışır) |
| Material Icons | İkonlar | `@expo/vector-icons` (Expo paketi; SDK 57'de ayrıca kuruluyor) | ✅ onaylandı |
| Font asset | Plus Jakarta Sans | `expo-font` (Expo'nun parçası) | ➖ |
| Splash | Açılış ekranı | `expo-splash-screen` (Expo'nun parçası) | ➖ |
| `showModalBottomSheet` | Ürün formu | Expo Router `presentation: 'formSheet'`, yetmezse `@gorhom/bottom-sheet` | ✅ / ❓ |
| `SnackBar` + eylem | "Geri al", hata mesajları | Kendi Reanimated tost bileşenimiz (paket yok) | ✅ |
| `flutter_test` + golden | Test | Jest + RNTL | ✅ |
| `flutter_lints` | Lint | ESLint + Prettier | ✅ |

## MIGRATION_TASKS listesinde olup bu uygulamada karşılığı zayıf olanlar

| Paket | Durum |
|---|---|
| TanStack Query | Kullanılacak. Canlı Firestore abonelikleri `setQueryData` ile cache'e yazılacak (ANALYSIS R5) |
| fetch / axios | **Kullanım yeri yok.** İstemci HTTP isteği atmıyor |
| react-native-mmkv 🔧 | Şu an saklanacak anahtar yok (tema modu kasıtlı olarak kalıcı değil). ❓ Kurulsun mu, yoksa ihtiyaç doğana kadar ertelensin mi? |
| expo-secure-store | Saklanacak token yok (RNFB oturumu kendisi tutuyor). ❓ Aynı soru |
| expo-sqlite | Gerekmiyor (Firestore offline yeterli) |
| expo-localization | Yalnızca `tr` var. Kurulur ama pratikte tek dil |
| Zod, react-hook-form, Zustand, FlashList, Reanimated, Gesture Handler, i18next, Maestro, EAS | Olduğu gibi kullanılacak |

## Onay bekleyen paketler (özet)

1. `@react-native-firebase/{app,auth,firestore,app-check}`
2. `@react-native-google-signin/google-signin`
3. `react-native-onesignal` + `onesignal-expo-plugin` (Faz 5)
4. `expo-haptics`, `expo-clipboard`, `expo-crypto`
5. `expo-dev-client` (zaten Faz 5'te var, **Faz 2'ye çekilmesi** öneriliyor)
6. İhtiyaç olursa `@gorhom/bottom-sheet`
7. MMKV ve secure-store: şimdi kurulsun mu, ertelensin mi?
