# Ev Hali (React Native) — Proje Talimatı

Bu repo, `~/AndroidStudioProjects/EvHali` (Flutter) uygulamasının Expo + TypeScript taşımasıdır.
Adım planı: `docs/MIGRATION_TASKS.md` (her fazın sonunda dur, onay bekle). Analiz: `docs/ANALYSIS.md`,
paket eşlemesi: `docs/PACKAGE_MAPPING.md`.

Expo'nun genel ajan kuralları (sürüme uygun belgeleri kullan, `npx expo install`, CNG): @AGENTS.md
Bu dosya ile AGENTS.md çelişirse bu dosya kazanır (ör. build EAS değil, yerel).

## Kararlar (2026-09-24, kullanıcı onayıyla)

- Taşıma onaylandı. MIGRATION_TASKS.md'deki teknoloji yığını (Zustand, TanStack Query, NativeWind vb.),
  Flutter CLAUDE.md §2'deki "kullanılmayacaklar" listesinin **yerine** geçer.
- Flutter projesi **salt okunur**, hiçbir dosyası değiştirilmez.
- Firebase erişimi için `@react-native-firebase` kullanılacak (App Check Play Integrity ve offline
  persistence korunur). Bu yüzden development build şart, Expo Go kullanılmaz.
- Remote: `https://github.com/yesilyurtahmeteren/EvHaliRN.git` (main branch)

- Paket adı Flutter ile aynı (`com.yesilyurtahmeteren.evhali`): RN sürümü Play Store'da Flutter'ın
  güncellemesi olarak çıkacak. `android.versionCode` 7'den büyük olmalı (şu an 8), release aynı upload
  key (`~/evhali-release.jks`) ile imzalanmalı.
- Build yerel: `npx expo run:android` (EAS yerine). Emülatör kullanılmıyor, test cihazı USB ile bağlı A53.

## Ortam notları (Faz 2)

- Expo SDK 57, RN 0.86, React 19.2, Reanimated 4, TypeScript 6, NativeWind 4.2.7 (Tailwind 3.4).
- TypeScript 6 `@types` paketlerini otomatik yüklemiyor, bu yüzden `tsconfig.json` → `types: ["jest"]` var.
- JS sekmeler `expo-router/js-tabs`'tan import edilir (`expo-router`'daki `Tabs` kullanımdan kaldırıldı).
- `@expo/vector-icons` SDK 57'de Expo'yla birlikte gelmiyor, ayrıca kurulu.
- Native build ortamı: `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`,
  `ANDROID_HOME=~/Library/Android/sdk`. `adb`: `~/Library/Android/sdk/platform-tools/adb` (PATH'te yok).
- `android/` klasörü CNG ile üretilir, elle düzenlenmez (`.gitignore`'da). Native ayarlar `app.json`'da.
- `google-services.json` Flutter projesinden kopyalandı, git'e girmez. **İçindeki `oauth_client` listesi boş.**
  Google Sign-In'de idToken sorunu çıkarsa Firebase Console'dan güncel dosya indirilmeli (Faz 4 auth).
- Renkler: `src/shared/theme/colors.ts` tek kaynak. Tailwind renkleri CSS değişkeni, `AppThemeProvider`
  kök View'a `vars()` ile basıyor. `tailwind.config.js` içindeki `colorNames` listesi colors.ts ile
  eşit olmalı (test kontrol ediyor).
- Font: değişken font yerine 4 statik ağırlık (`font-regular/medium/semibold/bold`). Android'de
  `fontWeight` ile ağırlık seçilmez, aile adı kullanılır.
- Kontroller: `npm run typecheck`, `npm run lint`, `npm test`.

## Flutter CLAUDE.md'den aynen geçerli olanlar

- Güvenlik (§4) pazarlığa kapalı: uygulamaya sır gömülmez, tek güvenlik sınırı `firestore.rules`,
  kurallar gevşetilerek sorun çözülmez, bildirim istemciden gönderilmez, veri minimizasyonu uygulanır.
- Veri modeli (§3) ve güvenlik kuralları değişmez. RN uygulaması Flutter sürümüyle aynı Firestore'a
  aynı biçimde yazar.
- Başarı ölçütü: "süt bitti" 3 saniyede girilebilmeli.
- Kod İngilizce, kullanıcının gördüğü metinler Türkçe (i18n dosyasından).
- TODO bırakma, soru varsa sor.
