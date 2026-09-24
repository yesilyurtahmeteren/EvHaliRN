# Ev Hali — Flutter Kod Tabanı Analizi (Taşıma Faz 1)

Kaynak: `~/AndroidStudioProjects/EvHali` (commit `e13aef0`, versionCode 7). Salt okunur incelendi.
Boyut: `lib/` altında 37 Dart dosyası, yaklaşık 4.100 satır. 3 veri modeli, 1 servis katmanı, 6 ekran.

> **En önemli bulgu:** Uygulamanın bir REST API'si **yok**. Bütün veri erişimi Firebase SDK'ları
> üzerinden doğrudan yapılıyor: Auth, Firestore canlı `snapshots()` akışları ve App Check.
> Tek güvenlik sınırı `firestore.rules`. MIGRATION_TASKS.md'deki "base URL, interceptor, token
> yenileme" maddelerinin burada karşılığı olmuyor; §3'te bunların nasıl yorumlanacağı anlatılıyor.

---

## 1. Ekranlar ve navigasyon ağacı

Flutter'da router yok. Navigasyon **durum güdümlü**: `StreamBuilder` zincirleri hangi ekranın
gösterileceğine karar veriyor. `Navigator.push` hiç kullanılmıyor; yalnızca modal alt sayfa ve
dialog'lar var.

```
main() ── Firebase.initializeApp → AppCheck.activate(debug | playIntegrity) → OneSignal.initialize
  └─ EvHaliApp  (ThemeMode: ValueNotifier, textScale: users/{uid}.textScale akışı)
      └─ AuthGate          authStateChanges()
          ├─ (bekliyor)    tam ekran spinner
          ├─ user == null → SignInScreen
          └─ user != null → HomeGate(uid)        users/{uid}.homeId akışı + push token senkronu
                ├─ (bekliyor)   tam ekran spinner
                ├─ hata         "Ev bilgisi yüklenemedi" + [Tekrar dene]   ← KRİTİK: hata ≠ "evin yok"
                ├─ homeId null → CreateHomeScreen   (oluştur / davet koduyla katıl / çıkış)
                └─ homeId var  → MainShell(homeId)  alt sekmeler, IndexedStack (sekme durumu korunur)
                      ├─ [0] Ev        HomeDashboardScreen(homeId)
                      │       ├─ Dialog: ev adını düzenle
                      │       └─ Dialog: davet kodunu yenileme onayı
                      ├─ [1] Alışveriş ListScreen(homeId)      ← VARSAYILAN sekme
                      │       └─ BottomSheet: showItemFormSheet(homeId, item?, initialName)
                      └─ [2] Profil    ProfileScreen()
                              └─ Dialog: evden ayrılma onayı
```

| Ekran | Dosya | Parametre | Buraya nasıl gelinir |
|---|---|---|---|
| SignInScreen | `screens/sign_in_screen.dart` | — | Oturum yok |
| CreateHomeScreen | `screens/create_home_screen.dart` | — | `users/{uid}.homeId == null` |
| "Ev bilgisi yüklenemedi" | `main.dart` içinde satır içi | — | `homeIdStream` hata verdi |
| MainShell | `widgets/main_shell.dart` | `homeId` | homeId dolu |
| HomeDashboardScreen | `screens/home_dashboard_screen.dart` | `homeId` | Sekme 0 |
| ListScreen | `screens/list_screen.dart` | `homeId` | Sekme 1 (varsayılan) |
| ProfileScreen | `screens/profile_screen.dart` | — (uid'i `currentUser`'dan alır) | Sekme 2 veya üst çubuktaki avatar |
| ItemFormSheet | `screens/item_detail_screen.dart` | `homeId`, `item?` (düzenleme), `initialName` | "Detaylı ekle" ikonu veya satır gövdesine dokunma |

MainShell üst çubuğu: solda logo, ortada sekme başlığı, sağda avatar (dokununca Profil sekmesi).
Alt çubuk özel yapım: ortadaki "Alışveriş" düğmesi yuvarlak, yeşil ve çubuğun 14px üstüne taşıyor.

Durum değişince yönlendirme **kendiliğinden** oluyor. Örneğin evden ayrılınca `homeId` null olur
ve HomeGate CreateHomeScreen'e düşer. Expo Router'da bunun karşılığı, kök ve `(app)` layout'larındaki
`<Redirect>` / korumalı rota mantığı (§10).

---

## 2. Durum yönetimi

Kasıtlı olarak **hiçbir paket yok** (Bloc, Riverpod, Provider ya da GetX kullanılmıyor). Katmanlar:

| Durum | Nerede tutuluyor | Tür | RN karşılığı |
|---|---|---|---|
| Oturum (Firebase User) | `authStateChanges()` → AuthGate | sunucu/SDK | RNFB `onAuthStateChanged` → Zustand `sessionStore` |
| `users/{uid}` (homeId, textScale, notificationsEnabled) | `snapshots()` → HomeGate, EvHaliApp, Profil | canlı sunucu verisi | `useUserDoc` (onSnapshot → TanStack Query cache) |
| `homes/{homeId}` | `homeStream` | canlı | `useHome` |
| Üyeler (`Map<uid, AppUser>`) | `membersStream`: ev dokümanı değişince her üyeyi `get()` | canlı + tek seferlik okuma | `useMembers` |
| Gereken ürünler + `isOffline` | `neededItemsStream` (`metadata.isFromCache`) | canlı | `useNeededItems` → `{items, isOffline}` |
| Alınan ürünler | `boughtItemsStream` | canlı | `useBoughtItems` |
| Katalog kategorileri | `catalogCategoriesStream` | canlı | `useCatalogCategories` |
| En sık 12 ürün (çipler) | `topCatalogStream().first`, **oturum boyunca dondurulmuş** | tek seferlik | `useQuery` + `staleTime: Infinity` (ekran açılışında bir kez) |
| Tema modu (sistem/açık/koyu) | `ThemeModeController` (statik `ValueNotifier`), **kalıcı değil** | istemci | Zustand `uiStore.themeMode` (kalıcı değil, aynı karar) |
| Seçili sekme | MainShell `setState` | yerel UI | Expo Router Tabs |
| Kategori filtresi, animasyondaki satırlar (`_leavingItems`, `_fadingOutIds`), yükleniyor bayrakları | `setState` | yerel UI | `useState` |
| Form alanları (ürün formu, ev adı, davet kodu) | `TextEditingController` | yerel | react-hook-form |

Önemli davranışsal ayrıntılar (bunlar birebir korunmalı):
- **İyimser işaretleme animasyonu:** Dokununca satır ~250 ms dolu onay kutusuyla görünür kalıyor,
  sonra ~200 ms'de soluyor. Firestore'un yerel güncellemesi satırı sorgudan erkenden çıkarsa bile
  `_leavingItems` kopyası sayesinde animasyon bitene kadar listede kalıyor. Aynı pencerede tekrar
  dokunmak işlemi geri alıyor. SnackBar 4 sn boyunca "Geri al" seçeneği gösteriyor.
- **Çip sırası dondurma:** `count` her eklemede değişiyor ama sıra oturum içinde sabit kalıyor, kas hafızası
  bozulmasın diye. Zaten listede olan ürünün çipi soluk ve devre dışı.
- **Hızlı ekleme alanı:** Enter'a basınca ekliyor, alanı temizliyor, **klavyeyi kapatmıyor** (odağı geri istiyor).
  Ekran altında sabit duruyor.
- **Liste açılışında temizlik:** Ürün listesi açılırken 7 günden eski `bought` kayıtları batch ile siliniyor.

---

## 3. "API katmanı" — Firebase erişimi

### 3.1 Base URL, endpoint ve interceptor
Hiçbiri yok. Karşılıkları şöyle:
- **Kimlik doğrulama:** Google Sign-In (`google_sign_in`) → `GoogleAuthProvider.credential` → `signInWithCredential`.
  İlk girişte `users/{uid}` dokümanı oluşturuluyor, sonraki girişlerde `displayName`/`photoUrl` güncelleniyor.
- **Token yönetimi:** Firebase SDK kendi hallediyor (ID token yenileme ve kalıcılık). Uygulamanın sakladığı token yok.
- **"Interceptor" karşılığı:** Yok. Buna en yakın şey App Check: SDK her Firestore ve Auth isteğine
  Play Integrity token'ı kendisi ekliyor.
- **Merkezi hata yönetimi:** `utils/feedback.dart` → `runWithFeedback()`. Yükleniyor durumunu aç/kapat,
  hata durumunda `HapticFeedback.mediumImpact()` ve SnackBar. `permission-denied` kodu ayrı bir Türkçe
  mesaja eşleniyor, diğer hatalar genel mesaja. Başarı mesajı isteğe bağlı.
  → RN: `src/shared/lib/firebase/` (Firestore erişimi) + `src/shared/lib/feedback.ts` (`useFeedbackMutation`).
  MIGRATION_TASKS'taki `api.ts` maddesi bu şekilde yorumlanacak.
- **Harici HTTP:** İstemci **hiçbir** HTTP isteği atmıyor. OneSignal SDK'sı kendi kanalını kullanıyor.
  Cloudflare Worker (`cloudflare-worker/`) sunucu tarafında; taşımadan etkilenmiyor.

### 3.2 Firestore işlemleri (tam liste, `services/firestore_service.dart`)

| İşlem | Tür | Ayrıntı |
|---|---|---|
| `createHome(name, uid)` | 3 ardışık yazma | `homes/{auto}` + `invites/{code}` + `users/{uid}.homeId` |
| `joinHome(code, uid)` | okuma + 2 yazma | `invites/{code}` get → `memberIds` arrayUnion → `users.homeId` |
| `leaveHome(homeId, uid)` | 2 yazma | `memberIds` arrayRemove → `users.homeId = null` |
| `renameHome` | update | `name` |
| `regenerateInviteCode` | 3 yazma | yeni invite set → `homes.inviteCode` → eski invite delete (eski kod boşsa atlanır) |
| `homeIdStream`, `userStream`, `homeStream` | onSnapshot | dokümanlar |
| `membersStream` | onSnapshot + N×get | |
| `neededItemsStream` | `where status==needed orderBy addedAt desc` | + `isFromCache` |
| `boughtItemsStream` | `where status==bought orderBy boughtAt desc` | |
| `addItem(...)` | **transaction** | Katalog oku → item set + catalog set (`count+1`, mevcut kategori korunur) |
| `updateItemDetails` | update | name/quantity/note/unit/urgent (kuraldaki ayrı "içerik" dalı) |
| `catalogCategoryFor` / `setCatalogCategory` (merge) | get / set merge | |
| `topCatalogStream` | `orderBy count desc limit 12` | |
| `catalogCategoriesStream` | tüm katalog | `docId → category` haritası |
| `markBought` / `markNeeded` | update | status/boughtBy/boughtAt (kuraldaki "durum" dalı) |
| `cleanupOldBoughtItems` | query + batch delete | 7 gün |
| `setNotificationsEnabled`, `setTextScale` | update | `users/{uid}` |
| `NotificationService._savePushToken` | update arrayUnion | `users.pushTokens` ← OneSignal subscription id |

Kritik iş kuralları (TS'e birebir taşınacak, test yazılacak):
- `normalizeName(name) = name.trim().toLowerCase().replaceAll('/', '-')`. Katalog doküman ID'si budur.
  ⚠️ Dart `toLowerCase()` ile JS `toLowerCase()` Türkçe `I`/`İ` harflerinde **farklı davranabilir**.
  Dart locale'den bağımsız dönüşüm yapıyor: `"I"→"i"`, `"İ"→"i̇"` (i + birleşik nokta). JS `toLowerCase()`
  da locale'den bağımsız ve aynı Unicode eşlemesini kullanıyor, bu yüzden uyumlu olması beklenir.
  **`toLocaleLowerCase('tr')` KULLANILMAMALI**, yoksa mevcut katalog ID'leri eşleşmez. Faz 3'te
  örnek adlarla (Süt, SÜT, IRMAK, İncir) test edilecek.
- Davet kodu: 8 karakter, alfabe `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, kriptografik rastgelelik
  (`Random.secure()` → RN'de `expo-crypto` `getRandomValues`). **Modulo sapması olmamalı**
  (32 karakterlik alfabe olduğu için bayt `& 31` kullanımı sapmasız).
- Katılırken kod temizliği: tüm boşluklar silinir, büyük harfe çevrilir.
- Görüntüleme: `AB7K9TQX` → `AB7K 9TQX`.
- `serverTimestamp()`: kurallar `addedAt == request.time` şartını arıyor.

---

## 4. Veri modelleri

Elle yazılmış, kod üretimi yok. Hepsi `fromMap` ile, eksik alanlar için varsayılan değer alıyor.

| Model | Alanlar (varsayılan) | Zod notu |
|---|---|---|
| `AppUser` | uid, displayName (`''`), photoUrl?, homeId?, notificationsEnabled (`true`), textScale (`1.0`) | `pushTokens` modelde yok, yalnızca yazılıyor |
| `Home` | id, name (`''`), memberIds (`[]`), inviteCode (`''`) | `createdAt` okunmuyor |
| `Item` | id, name, status (`needed`/`bought`, bilinmeyen değer → needed), addedBy, addedAt (Timestamp, **null ise now**), boughtBy?, boughtAt?, quantity (1), note?, unit (`adet`), urgent (false) | `addedAt` gönderilmeyi bekleyen yazmalarda `null` gelir; bu tolere edilmeli. `notified` okunmuyor |
| `CatalogItem` | id (= normalize ad), name, count (0), category? | |
| `ItemCategory` | 10 sabit değer, markette yürüme sırasına göre | kural ile aynı liste → `z.enum` |
| `ItemUnit` | `adet, kg, paket, litre, demet` | `z.enum` |

`invites/{code}` için model sınıfı yok (`homeId`, `createdAt`). Şema ve güvenlik kuralları
**değişmeyecek**. RN uygulaması aynı Firestore'a aynı biçimde yazmalı (Flutter sürümüyle aynı anda çalışabilir).

---

## 5. Yerel depolama

**Hiç yok.** `shared_preferences`, Hive ya da sqflite kullanılmıyor. Tek "yerel veri" Firestore'un
varsayılan olarak açık olan offline persistence'ı. Tema modu bilinçli olarak kalıcı tutulmuyor.
Yazı boyutu Firestore'da saklanıyor.

→ RN'de MMKV'de saklanacak bir anahtar şu an **yok**. `expo-secure-store` için de token yok
(RNFB oturumu kendi saklıyor). Bu iki paketin Faz 2'de kurulup kurulmayacağı onayına bağlı
(bkz. PACKAGE_MAPPING.md ❓).

---

## 6. Tema

Kaynak: `lib/theme.dart` + `lib/theme/*`. Tasarım dili: DESIGN.md "Warm Nordic Domesticity".

- **Açık şema:** 34 M3 rolü sabit hex (adaçayı `primary #325346`, terracotta `secondary #964824`,
  bal `tertiary #644800`, `surface #FCF9F3` …).
- **Koyu şema:** `ColorScheme.fromSeed(#446557, dark)` ile **çalışma anında türetiliyor**, sabit
  hex yok. → RN'de hex değerler bir kez üretilip sabitlenecek (Flutter'da tek seferlik bir betikle
  ya da `@material/material-color-utilities` ile). Faz 2 kararı.
- **Ek renkler (`EvHaliColors`):** 8 renk, açık ve koyu. Kaydırmalı silme ve bekleme ikonu renkleri tanımlı
  ama kullanılmıyor.
- **Üye renkleri:** 6 pastel ton (açık ve koyu), `uid.hashCode % 6`. ⚠️ Dart `String.hashCode`
  platforma özel. TS'te belirlenimci bir hash (ör. djb2) kullanılacak, **renkler Flutter'dakinden
  farklı çıkabilir**. Kabul edilebilir kozmetik bir fark.
- **Tipografi:** Tek aile, Plus Jakarta Sans (değişken font, `assets/fonts/PlusJakartaSans.ttf`).
  15 M3 rolü: display 32/29/26, headline 26/20/18, title 18/16/14, body 16/14/13, label 14/12/11.
  ⚠️ RN Android'de değişken fontun `fontWeight` ekseni güvenilir çalışmıyor. **Statik ağırlık
  dosyaları** (400/500/600/700) gerekecek (google/fonts reposunda mevcut, OFL lisanslı).
- **Şekil:** 8/16/16/24/24/32/32/48 + stadyum (pil). Butonlar, çipler ve ikon butonlar pil biçiminde;
  onay kutusu yuvarlak.
- **Boşluk:** xs4 sm8 md16 lg24 xl36 xxl48 xxxl64, screenMargin 20, dokunma hedefi 48, satır yüksekliği 64.
- **Hareket:** `motor` M3 yayları (spatial fast/default/slow, effects fast/default/slow), "hareketi azalt"
  açıksa 100 ms lineer. → Reanimated `withSpring` + `useReducedMotion`.
- **Gölgeler:** SoftCard (adaçayı tonlu yumuşak çift gölge), alt çubuk ve sepet düğmesi gölgesi.
- **Yazı boyutu:** Sistem ölçeğinin **üzerine** çarpılan kullanıcı çarpanı (0.9/1.0/1.15/1.3).
  ⚠️ RN'de global `TextScaler` yok. Sistem ölçeği `allowFontScaling` ile otomatik uygulanıyor, çarpan ise
  ortak `<AppText>` bileşeninde `fontSize × multiplier` olarak uygulanacak. Ham `<Text>` kullanımı
  lint kuralıyla yasaklanabilir.
- **Açık/koyu:** Varsayılan sistem, Profil'deki anahtar oturum içinde geçersiz kılıyor.

---

## 7. Çoklu dil

Tek dil: **Türkçe**. Metinler `lib/strings.dart` içinde (yaklaşık 110 sabit ve fonksiyon; parametreli
olanlar: `boughtSectionTitle(n)`, `statusCardBody`, `itemBoughtMessage`, `inviteShareMessage` vb.).
`intl` paketi CLAUDE.md'de listeli ama **pubspec'te yok**, tarih biçimlendirmesi de kullanılmıyor.
→ i18next yalnızca `tr` kaynağıyla kurulacak. `categoryLabels`, `unitLabels` ve `categoryEmojis`
haritaları da kaynak dosyasına taşınacak. `joinNames` ("A, B ve C") yardımcı fonksiyon olarak kalacak
(`Intl.ListFormat('tr')` Hermes'te güvenilmez).

---

## 8. Asset'ler

| Asset | Kaynak | RN hedefi |
|---|---|---|
| Logo 512×512 | `assets/images/logo.png` | `assets/images/logo.png` (uygulama içi logo) |
| Font | `assets/fonts/PlusJakartaSans.ttf` + `OFL.txt` | Statik ağırlık dosyaları ile değiştirilecek (§6) |
| Launcher ikonu | `android/app/src/main/res/mipmap-*` (tüm görsel background katmanında, foreground boş) | `app.json` → `android.adaptiveIcon` (kaynak: 1024 px orijinal `~/Downloads/EvHali Logo 3.png`) |
| Açılış ekranı | `drawable*/splash_logo.png`, zemin `#FCF9F3` | `expo-splash-screen` config |
| Play Store ikonu | `play-store-assets/icon-512.png` | Değişmiyor |
| Animasyon dosyası (Lottie/Rive) | yok | — |
| İkonlar | Material Icons (home, shopping_basket, person, tune, add, close, mic_none, local_fire_department, star, share, copy, vpn_key, edit, logout, exit_to_app, cloud_off, dark_mode, light_mode, notifications_active, shield, check_circle, shopping_bag) | `@expo/vector-icons` → `MaterialIcons` (Expo ile birlikte geliyor) |

---

## 9. Platforma özel kod, native entegrasyonlar, izinler

- **MethodChannel / platform kodu:** **Yok.** `MainActivity` boş bir `FlutterActivity`. `platform/`
  klasörü hiç oluşturulmamış.
- **Native entegrasyonlar (hepsi development build gerektirir):**
  1. Firebase Auth + Google Sign-In (SHA-1/SHA-256 parmak izleri Firebase'e kayıtlı olmalı)
  2. Cloud Firestore (offline persistence)
  3. App Check: debug sağlayıcı (geliştirme) / Play Integrity (release)
  4. OneSignal push: izin istemi, `pushSubscription.id` → `users.pushTokens`, token yenilenince güncelleme.
     Açılışta `OneSignal.Debug.setLogLevel(verbose)` çağrılıyor (release'de de; RN'de yalnızca `__DEV__` olmalı).
  5. Paylaşım menüsü (`share_plus`), pano (`Clipboard`), haptik (`HapticFeedback` ile selection, light ve medium)
- **İzinler (birleştirilmiş manifest, release):** `INTERNET`, `ACCESS_NETWORK_STATE`,
  `POST_NOTIFICATIONS`, `VIBRATE`, `WAKE_LOCK`, `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE`,
  `c2dm.RECEIVE`, ve OneSignal'ın eklediği launcher rozeti izinleri (Samsung, Huawei, Oppo, Sony, HTC vb.).
  Hepsi kütüphanelerden geliyor, uygulamanın kendi manifestinde izin yok. **Kamera, konum ya da rehber
  izni yok** (CLAUDE.md §4.1.5 veri minimizasyonu gereği).
- **Kimlikler:** `applicationId = com.yesilyurtahmeteren.evhali`, Firebase projesi `evhali-afde3`,
  OneSignal App ID `243eef8a-…` (herkese açık bir ID, sır değil).
- **İmzalama:** `~/evhali-release.jks` + `android/key.properties`. Play'de App Signing ve "Otomatik koruma"
  (pairip) açık. **Cihazdaki gerçek sertifika** farklı; SHA'lar CLAUDE.md'de kayıtlı.

---

## 10. Hedef Expo Router ağacı (önerilen)

```
app/
  _layout.tsx                 Providers (QueryClient, GestureHandler, Theme, i18n), font yükleme, splash
  index.tsx                   → oturum/ev durumuna göre Redirect
  sign-in.tsx                 (oturumsuz)
  (app)/
    _layout.tsx               korumalı rota: oturum yoksa → /sign-in; users/{uid} hatası → HomeLoadError
    create-home.tsx           homeId null
    (tabs)/
      _layout.tsx             Tabs + özel alt çubuk (ortada taşan sepet düğmesi) + üst çubuk (logo/avatar)
      home.tsx                Ev
      index.tsx               Alışveriş (varsayılan sekme)
      profile.tsx             Profil
    item-form.tsx             presentation: 'formSheet' | 'modal'   params: { itemId?, initialName? }
```

Parametreler: `homeId` URL'de taşınmayacak, oturum store'undan okunacak (Flutter'da da tek kaynak
`users/{uid}.homeId`). `item-form` yalnızca `itemId` alacak; ürünü query cache'ten bulacak.

---

## 11. Taşıma sırası (Faz 4 için feature listesi)

Bağımlılığı en az olandan en çoğa doğru:

1. **auth**: SignInScreen, oturum store'u, korumalı rotalar, `users/{uid}` oluşturma/güncelleme.
   Bağımlılık: yalnızca Firebase ve Google Sign-In.
2. **home-onboarding**: HomeGate (bekliyor / hata / evin yok / evin var), CreateHomeScreen
   (oluştur ve katıl), davet kodu üretimi. Bağımlılık: auth.
3. **shell + profile**: sekmeli kabuk, üst ve alt çubuk, Profil (tema anahtarı, bildirim tercihi,
   yazı boyutu, çıkış, evden ayrıl). Bağımlılık: auth, users dokümanı.
4. **home-dashboard**: ev adı düzenleme, durum kartı, davet kodu (paylaş/kopyala/yenile), üyeler.
   Bağımlılık: home, members, items sayıları.
5. **shopping-list**: gereken/alınan akışları, kategori gruplama ve filtre, iyimser işaretleme + geri al
   animasyonu, çevrimdışı bandı, hızlı ekleme çipleri (dondurulmuş), alt ekleme alanı, 7 gün temizliği.
   Bağımlılık: members, catalog. **En riskli feature.**
6. **item-form**: ekleme/düzenleme alt sayfası (react-hook-form + Zod: ad 1-60, miktar 1-99, not ≤100,
   birim/kategori enum, acil), sık alınanlar, senkron ibaresi, sesli giriş yer tutucusu.
   Bağımlılık: shopping-list.
7. **notifications** (Faz 5): OneSignal başlatma, izin, subscription id senkronu. Bildirime dokununca
   Alışveriş sekmesi açılır (varsayılan sekme olduğu için ek kod gerekmiyor).

---

## 12. Riskler ve açık konular

| # | Konu | Etki |
|---|---|---|
| R1 | **Expo Go kullanılamaz**. RNFB, Google Sign-In ve OneSignal native modül. İlk ekran bile development build gerektiriyor. MIGRATION_TASKS Faz 5'teki dev-client adımı **Faz 2'ye çekilmeli**. | Plan sırası |
| R2 | **Paket adı / Play Store yolu:** RN uygulaması aynı `com.yesilyurtahmeteren.evhali` ile Flutter'ın *güncellemesi* olarak mı yayınlanacak, yoksa ayrı bir uygulama mı olacak? Aynı ad seçilirse aynı upload key ile imzalanmalı (EAS'a mevcut `.jks` yüklenir). Ayrı ad seçilirse Firebase'e yeni Android uygulaması, yeni SHA'lar ve App Check kaydı gerekir. | Faz 2 öncesi karar |
| R3 | **Yeni imza parmak izleri:** EAS/dev build'in debug keystore'u farklıysa Google Sign-In "not registered to use OAuth2.0" hatası verir. SHA-1/256 Firebase'e eklenmeli (senin Console erişiminle). | Faz 2 cihaz testi |
| R4 | **App Check debug token:** Yeni build yeni debug token üretir, Console'da whitelist'e eklenmesi gerekir. | Faz 2 cihaz testi |
| R5 | TanStack Query istek/yanıt modeline göre tasarlanmış, Firestore ise canlı akış veriyor. Desen: `onSnapshot` → `queryClient.setQueryData` (abonelik hook'u), yazmalar `useMutation` ile. RNFB offline persistence cache'i zaten tuttuğu için TanStack'in kalıcılığı (persister) **kullanılmayacak**. | Mimari |
| R6 | M3 bileşenleri RN'de yok (Chip, SnackBar+eylem, BottomSheet, ExpansionTile, Checkbox). NativeWind ile elle yazılacak. SnackBar ve BottomSheet için paket gerekebilir (❓). | İş yükü |
| R7 | Değişken font (§6) ve global yazı ölçeği (§6) | Faz 2/3 |
| R8 | `normalizeName` Türkçe büyük/küçük harf uyumu (§3.2) | Veri bütünlüğü, testle korunacak |
| R9 | Cihaz: A53 şu an `adb devices`'ta **görünmüyor** (liste boş). USB hata ayıklama açık olmalı. `adb` PATH'te değil: `~/Library/Android/sdk/platform-tools/adb`. | Faz 2 |
| R10 | MIGRATION_TASKS "Android Studio kurulu değil" diyor ama bu Mac'te Android SDK, JBR ve Pixel 4 AVD kurulu. Bu yüzden `npx expo run:android` ile **yerel** build de mümkün (EAS kuyruğuna gerek kalmadan, daha hızlı). Emülatör kullanılmayacak kuralı korunuyor. | Hız |
| R11 | Golden testler taşınamaz, RNTL snapshot/davranış testleriyle değiştirilecek. | Test |
| R12 | Flutter CLAUDE.md'deki "durum yönetimi paketi yok / yerel DB yok / katman yok" kararları bu taşımayla bilinçli olarak geçersiz. Karar `EvHaliRN/CLAUDE.md`'ye yazıldı; Flutter reposuna dokunulmadı. | Belgeleme |
