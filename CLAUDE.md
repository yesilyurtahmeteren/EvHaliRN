# Ev Hali (React Native) — Proje Talimatı

Bu repo, `~/AndroidStudioProjects/EvHali` (Flutter) uygulamasının Expo + TypeScript taşımasıdır.
Adım planı: `docs/MIGRATION_TASKS.md` (her fazın sonunda dur, onay bekle). Analiz: `docs/ANALYSIS.md`,
paket eşlemesi: `docs/PACKAGE_MAPPING.md`.

Expo'nun genel ajan kuralları (sürüme uygun belgeleri kullan, `npx expo install`, CNG): @AGENTS.md
Bu dosya ile AGENTS.md çelişirse bu dosya kazanır (ör. build EAS değil, yerel).

## Güncel durum (2026-09-25) — yeni oturum buradan başlar

- **Fazlar:** 1-4 tamam, Faz 5 kodu tamam. Faz 6 başlamadı.
- **2026-09-25: Tasarım handoff'u uygulandı** (`docs/design/`: HANDOFF.md, tokens.json, Main.dc.html —
  tek doğruluk kaynağı). Önceki "animasyon yumuşatma" işi bunun içinde kapandı. Kullanıcı kararları:
  - Veri tasarıma uyduruldu: **4 bölüm** (`food/clean/care/other`), **6 birim** (`adet/kg/g/litre/paket/kutu`).
    Geçiş dönemi: kurallar eski 10 kategoriyi ve `demet`'i de kabul ediyor (Play'deki Flutter sürümü için);
    uygulama okurken eski değerleri 4'lüye çevirir (`parseCategory`, `unit` → adet). Flutter tamamen
    kalkınca eski değerler `firestore.rules`'tan çıkarılabilir (veri geçiş betiği yazılmadı, gerek olmadı).
  - **Roller** (`homes.roles`, haritada yoksa 'member'; harita yoksa kurucu = `memberIds[0]` yönetici):
    Yönetici ev adı/kod/rol/üye çıkarma; Üye ve Çocuk aynı haklar (Çocuk yalnızca etiket); Misafir
    yalnızca görüntüler (kural düzeyinde). Yönetici, başka üye varken yöneticiliği devretmeden ayrılamaz.
  - **Bildirimler ekranı** (`homes/{homeId}/events`): Worker 'added'/'bought' (+ push), günlük 06:00 UTC
    'reminder' (3 günden uzun bekleyen) ve pazartesi 'weekly' kaydı yazar, 14 günden eskileri siler.
    İstemci yalnızca kendi 'joined' kaydını yazar ve `readBy`'a kendini ekler.
  - İki bildirim tercihi `notifyAdded`/`notifyBought` (yoksa eski `notificationsEnabled`).
  - Hesabı sil (Google ile yeniden doğrulama → evden çık → users sil → Auth sil). Kamera ile fotoğraf YOK
    (Storage Blaze ister, kullanıcı kart istemiyor).
  - Sesli giriş: `expo-speech-recognition` + RECORD_AUDIO (izin dokununca). "iki litre süt" ayrıştırılır.
  - Yeni paketler (kullanıcı onayıyla): `react-native-svg`, `expo-blur`, `expo-speech-recognition`.
  - Alttaki hızlı ekleme alanı ve sık alınan çipleri kaldırıldı (tasarım birebir); ekleme alt sayfadan.
- **Deploy edildi (kullanıcı onayıyla, 2026-09-25):** `firestore.rules` + `firestore.indexes.json`
  (`firebase deploy --only firestore:rules,firestore:indexes`) ve Worker (`cd cloudflare-worker && npx wrangler
  deploy`, iki cron: `* * * * *` ve `0 6 * * *`). **Kurallar, index'ler ve Worker artık bu repoda**
  (Flutter reposundan kopyalandı; Flutter reposuna dokunulmuyor). Kural değişikliğinden önce emülatörde test
  edin (scratchpad'de `@firebase/rules-unit-testing` ile 50 senaryo çalıştırılmıştı; kalıcı test yok).
- **A53'te doğrulanan:** ekleme (toast + vurgu), işaretleme (600 ms, Alınanlar'a taşınma, Worker 'bought'
  işledi), tema geçişi (800 ms), Evim, Profil. **Doğrulanmayan:** Bildirimler ekranı başka hesaptan gelen
  kayıtla, rol değiştirme/üye çıkarma, hesap silme, sesli giriş (gerçek konuşma), push "Alınanlar".
- App Check: yeni debug build'in token'ı (`0bd4e4aa…`) kullanıcı tarafından Console'a eklendi.
- Tema tercihi MMKV'de kalıcı (`themeMode`), ilk açılışta sistem teması.

## Tasarım katmanı (2026-09-25)

- Renkler `src/shared/theme/colors.ts` (tokens.json birebir). **Renk Tailwind sınıfı olarak verilmez:**
  `AppThemeProvider` tek bir `progress` (0 aydınlık / 1 koyu) değerini 800 ms canlandırır; `Box`, `AppText`,
  `PressScale`, `Icon` rengi `use-theme-color.ts` ile token adından türetir. Tailwind yalnızca yerleşim için.
- `AppText`: `size/weight/lineHeight/tracking/tone/scaled/strike`. `scaled` = tasarımdaki `calc(* var(--ts))`
  metinleri, "Büyük yazı" (1.14) açıkken 450 ms'de büyür. İç içe metin için düz `Text` (animasyonlu stil
  iç içe metinde çalışmaz).
- Eğriler ve süreler `motion.ts` (`Ease`, `Durations`). Giriş animasyonları `components/motion.tsx`
  (`Rise`, `ScreenEnter`, `Pop`, `Floaty`, `FlashRing`). Sekmeler bağlı kaldığı için ekran içeriği
  `useFocusKey` ile her odaklanışta yeniden bağlanır (animasyonlar tasarımdaki gibi baştan oynar).
- İkonlar `components/icon.tsx`'te Main.dc.html'deki SVG yollarıyla.
- Alt sayfalar (İhtiyaç Ekle/düzenle, üye rolü) route değil: `features/shell/ui-store.ts` + `SheetHost`,
  kabuğun üstünde; Android bulanıklığı için sekmeler `BlurTargetView` içinde.
- Canlı sorgular `includeMetadataChanges: true` (yoksa `fromCache` ilk değerde takılıyor, çevrimdışı bandı
  hiç kalkmıyordu — eski arayüzde de vardı, düzeltildi).
- Testlerde ekranlar `src/test-utils/render.tsx` (`renderWithTheme`) ile; `expo-router` mock'u
  `test-utils/router-mock.ts`. MMKV, konuşma tanıma ve blur `jest.setup.ts`'te mock'lu.
- Metro: kullanıcının 8081'de kendi Metro'su çalışıyor olabilir; eski paketi sunuyorsa 8082'de
  `npx expo start --dev-client --port 8082 --clear` + `adb reverse tcp:8082 tcp:8082`.

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
- Renkler: bkz. "Tasarım katmanı". Test, colors.ts'in `docs/design/tokens.json` ile eşitliğini kontrol ediyor.
- Font: değişken font yerine 5 statik ağırlık (regular/medium/semibold/bold/extrabold). Android'de
  `fontWeight` ile ağırlık seçilmez, aile adı kullanılır.
- Kontroller: `npm run typecheck`, `npm run lint`, `npm test`.

## Ortak katman kuralları (Faz 3)

- Metin: ham `<Text>` yerine `AppText` (bkz. "Tasarım katmanı").
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
- Veri modeli (§3) 2026-09-25'te kullanıcı onayıyla genişletildi (bkz. "Güncel durum"); kurallar geriye
  uyumlu tutuldu, Flutter sürümü aynı Firestore'da çalışmaya devam ediyor.
- Başarı ölçütü: "süt bitti" 3 saniyede girilebilmeli.
- Kod İngilizce, kullanıcının gördüğü metinler Türkçe (i18n dosyasından).
- TODO bırakma, soru varsa sor.
