# Ev Hali (React Native) — Proje Talimatı

Bu repo, `~/AndroidStudioProjects/EvHali` (Flutter) uygulamasının Expo + TypeScript taşımasıdır.
Adım planı: `docs/MIGRATION_TASKS.md` (her fazın sonunda dur, onay bekle). Analiz: `docs/ANALYSIS.md`,
paket eşlemesi: `docs/PACKAGE_MAPPING.md`.

Expo'nun genel ajan kuralları (sürüme uygun belgeleri kullan, `npx expo install`, CNG): @AGENTS.md
Bu dosya ile AGENTS.md çelişirse bu dosya kazanır (ör. build EAS değil, yerel).

## Güncel durum (2026-09-25) — yeni oturum buradan başlar

- **Fazlar:** 1-4 tamam (tüm ekranlar taşındı). Faz 5 kodu tamam (`45bdcca`: OneSignal + izin politikası);
  uygulama A53'te girişten listeye uçtan uca çalıştı. Faz 6 başlamadı.
- **Faz 5'te kullanıcıdan bekleyen cihaz kontrolleri** (sonuçlar henüz gelmedi):
  1. Push bildirimi: başka hesaptan ürün eklenince A53'e bildirim geliyor mu, dokununca liste açılıyor mu?
  2. Uçak modunda ekleme: `addItem` transaction'ı çevrimdışı hata veriyor mu (Flutter'la aynı yöntem)?
  3. Ürünü hiç eklenmemiş bir adla yeniden adlandırınca `setCatalogCategory` (merge) kurala takılıyor mu
     (katalog kaydında `count` yok → `count is int` şartı)? Flutter'da da aynı; kural DEĞİŞTİRİLMEZ.
- **Cihazda çalıştırma:** `cd ~/AndroidStudioProjects/EvHaliRN && JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ANDROID_HOME=~/Library/Android/sdk npx expo run:android`
  (`--device` seri no değil model adı ister; tek cihaz bağlıysa parametresiz). Sadece JS değiştiyse Metro
  (`npx expo start`) yeterli, yeniden derleme gerekmez. `CI=1` Metro'da hot reload'u kapatır, kullanma.

## Sıradaki iş: animasyon / geçiş yumuşatma (kullanıcı talebi, 2026-09-25)

Kullanıcı şikâyeti: "fonksiyonlara tıkladığımda geçişler çok sert". Bu ayrı bir oturumda ele alınacak.
Başlamadan önce kullanıcıya hangi ekran/etkileşimde en çok rahatsız olduğunu sormak faydalı; aşağıdaki
envanter tahmini öncelik sırası.

**Hazır altyapı (kullanılmıyor):** `src/shared/theme/motion.ts` → `AppMotion.spatialFast/Default/Slow` ve
`effectsFast/Default/Slow` (Flutter `motor` M3 yaylarının Reanimated `withSpring` karşılığı, sönüm oranı
katsayıya çevrilmiş). Kodda hiçbir yerde kullanılmıyor, ilk iş bunları devreye almak. "Hareketi azalt"
açıkken Flutter 100 ms lineer geçişe düşüyordu (`AppMotion.reducedMotionDurationMs`); Reanimated'ta
`useReducedMotion()` ya da animasyon config'inde `reduceMotion` ile aynı davranış korunmalı.

**Mevcut durum (animasyon olan / olmayan yerler):**
| Nerede | Şu an | Dosya |
|---|---|---|
| Sekme geçişi (Ev/Alışveriş/Profil) | Animasyon yok, anında değişiyor | `app/(app)/(tabs)/_layout.tsx` (js-tabs; `animation` screenOption'ı var mı SDK 57 belgesinden bak) |
| Alt çubuk seçili sekme / ortadaki sepet | Anında renk değişimi | `src/features/shell/components/shell-tab-bar.tsx` |
| Ev Oluştur ↔ sekmeler, giriş ↔ uygulama | `Stack.Protected` değişimi, varsayılan geçiş | `app/_layout.tsx`, `app/(app)/_layout.tsx` |
| Ürün formu (alt sayfa) | `transparentModal` + `slide_from_bottom`; karartma da içerikle birlikte kayıyor (ayrı fade yok), sürükleyerek kapatma yok | `app/(app)/_layout.tsx`, `src/features/item-form/components/item-form-screen.tsx` |
| Onay / ev adı pencereleri | RN `Modal` `animationType="fade"` (kart ölçeklenmiyor) | `confirm-dialog.tsx`, `rename-home-dialog.tsx` |
| Ürün işaretleme | Kutu anında doluyor; satır 250 ms bekleyip 200 ms `withTiming` ile soluyor; satır kaybolunca liste zıplıyor (yükseklik animasyonu yok) | `item-tile.tsx`, `use-check-off.ts` |
| Listeye ürün ekleme / kategori grubu oluşma | Animasyon yok (FlashList satırı anında beliriyor) | `shopping-list/components/list-screen.tsx` |
| Alınanlar bölümünü aç/kapa | Anında, ok ikonu dönmüyor | `list-sections.tsx` (`BoughtHeader`) |
| Çip seçimi (filtre, yazı boyutu, kategori, birim) | Anında renk + tik | `src/shared/components/chip.tsx` |
| Onay kutusu | Anında dolu/boş | `src/shared/components/checkbox.tsx` |
| Düğmeler | Yalnızca `active:opacity-80`, ölçek/ripple yok | `button.tsx` ve Pressable'lar |
| Anahtarlar (karanlık mod, bildirim, acil) | RN `Switch` varsayılanı | `profile-screen.tsx`, `item-form.tsx` |
| Karanlık mod geçişi | Tüm renkler anında değişiyor | `theme-provider.tsx` |
| Toast | `FadeInDown` / `FadeOutDown` (tek iyi örnek) | `toast/toast-host.tsx` |
| Yükleniyor çubuğu | `withRepeat(withTiming)` | `loading-bar.tsx` |

**Kurallar:**
- Yeni paket ekleme (Moti, Lottie, `@gorhom/bottom-sheet` vb.) kullanıcı onayı ister. Reanimated 4 +
  Gesture Handler zaten kurulu; önce bunlarla çöz (layout animasyonları `entering/exiting/layout`,
  `LinearTransition`, `useAnimatedStyle`). Sürükleyerek kapatılan alt sayfa gerekiyorsa önce sor.
- FlashList v2'de satır giriş/çıkış animasyonu Reanimated layout animasyonlarıyla sorunlu olabilir;
  SDK/FlashList belgesine bakmadan varsaymayın, gerekirse cihazda deneyin.
- Başarı ölçütü bozulmamalı: "süt bitti" 3 saniyede. Hızlı ekleme alanında klavye kapanmamalı; ekleme
  animasyonu girişi yavaşlatmamalı (M3 "fast" yaylar, 150-250 ms).
- İşaretleme akışının zamanlaması (250 ms bekle + 200 ms sol, bu pencerede geri al) iş kuralıdır;
  görünüm yumuşatılabilir ama pencere ve "Geri al" davranışı korunmalı (`use-check-off.test.tsx`).
- Testler: Reanimated jest'te animasyonları anında bitirir; mevcut 177 test yeşil kalmalı. Görsel sonuç
  mutlaka A53'te kontrol edilmeli (jest animasyon kalitesini ölçmez).

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

## Ortak katman kuralları (Faz 3)

- Metin: ham `<Text>` yerine `AppText` (`variant` = tipografi rolü, `tone` = renk token'ı). Kullanıcının
  yazı boyutu çarpanı (`text-scale-store`) yalnızca AppText/TextField üzerinden uygulanıyor. Prop adı `role`
  DEĞİL: RN'nin erişilebilirlik `role` prop'uyla çakışıp tipi `never` yapıyordu.
- Firestore okuma: `liveQueryOptions(key, subscribe)` + `useQuery` (`src/shared/lib/firebase/live-query.ts`).
  Okuma hatası "veri yok" ile karıştırılmaz, sorgu `error` durumuna düşer.
- Yazma: `useFeedbackMutation` (hatada titreşim + Türkçe toast, `run()` bool döner). Hata sessizce yutulmaz.
- Oturum: `useSessionStore` (tek yazan `useAuthListener`), (app) ekranlarında `useRequiredUser()`.
  Çıkışta `queryClient.clear()` tüm Firestore dinleyicilerini kapatır.
- Ev: `users/{uid}` tek sorgu (`useUserDoc`); HomeGate `(app)/_layout.tsx`'te. Sekmeler evi
  `useRequiredHomeId()` ile alır (HomeIdProvider, URL parametresi yok).
- Modeller: `src/shared/schemas/`, katalog ID'si `normalizeName` (asla `toLocaleLowerCase('tr')`).
- Testler: RNTL 14'te `render`, `renderHook`, `fireEvent.*`, `act` **async**, hepsi `await` edilmeli.
  Jest sahte zamanlayıcıları RNTL'nin async act'ini kilitliyor, kısa gerçek süre + `waitFor` kullan.
  Reanimated 4 için jest `resolver: react-native-worklets/jest/resolver.js` gerekli (package.json'da).
  `jest.setup.ts` TanStack bildirimlerini eşzamanlı yapıyor (aksi halde "not wrapped in act" uyarıları)
  ve FlashList ölçümlerini sabitliyor (`@shopify/flash-list/jestSetup` 2.0.2'de bozuk, kullanma).
  FlashList içeren ekran testlerinde render sonrası kısa bir `act` beklemesi gerekiyor.
  `npm test` sonunda "worker failed to exit gracefully" uyarısı çıkıyor ama testler geçiyor ve süreç kapanıyor.
  `--detectOpenHandles` bir kaynak göstermedi.
- `expo-asset` doğrudan bağımlılık olarak eklendi (Faz 3): `expo`'nun iç bağımlılığıydı ama hoist
  edilmemişti, bu yüzden `@expo/vector-icons` → `expo-font` onu bulamıyordu.

## Native / bildirim (Faz 5)

- OneSignal: `react-native-onesignal` + `onesignal-expo-plugin` (`mode` yalnızca iOS APNs için).
  App ID `.env`'de (herkese açık). REST API anahtarı ASLA uygulamada değil, Cloudflare Worker secret'ında.
- İzinler `app.json` → `android.permissions` + `blockedPermissions`. Yeni kütüphane eklenince
  `processReleaseMainManifest` çıktısındaki izinleri kontrol et; veri minimizasyonuna aykırı olan engellenir.
- Expo'nun debug anahtarı `android/app/debug.keystore` (Flutter'ın `~/.android/debug.keystore`'undan farklı);
  SHA'ları Firebase'e ayrıca eklenmeli. Play'deki Flutter sürümü telefondayken debug kurulumu imza
  uyuşmazlığıyla reddedilir.
- 2026-09-25: Expo debug SHA1 `5E:8F:16…:F6:25` ve SHA256 `FA:C6:17…:3B:9C` Firebase'e eklendi
  (`firebase apps:android:sha:create`, kullanıcı onayıyla). A53'te giriş dahil uçtan uca çalıştı.
  `android/` (CNG) silinip yeniden üretilirse debug.keystore değişebilir; o zaman SHA'lar yeniden eklenmeli.
  Google Sign-In'de imza kayıtsızsa ekranda hiçbir şey olmaz (Google bunu "vazgeçti" diye döner);
  teşhis: `adb logcat -d | grep "not registered to use OAuth2.0"`.

## Flutter CLAUDE.md'den aynen geçerli olanlar

- Güvenlik (§4) pazarlığa kapalı: uygulamaya sır gömülmez, tek güvenlik sınırı `firestore.rules`,
  kurallar gevşetilerek sorun çözülmez, bildirim istemciden gönderilmez, veri minimizasyonu uygulanır.
- Veri modeli (§3) ve güvenlik kuralları değişmez. RN uygulaması Flutter sürümüyle aynı Firestore'a
  aynı biçimde yazar.
- Başarı ölçütü: "süt bitti" 3 saniyede girilebilmeli.
- Kod İngilizce, kullanıcının gördüğü metinler Türkçe (i18n dosyasından).
- TODO bırakma, soru varsa sor.
