# Flutter → React Native (Expo) Taşıma Görevleri

> Bu dosya Claude Code için hazırlanmıştır. Her fazı sırayla uygula, bir faz bitmeden
> sonrakine geçme. Her fazın sonunda dur, yaptıklarını özetle ve onayımı bekle.
> Tamamlanan görevlerin kutusunu `[x]` olarak işaretle.

---

## 0. Bağlam

- **Kaynak proje:** Flutter uygulaması → `~/AndroidStudioProjects/EvHali` (sadece okunacak, **asla değiştirme**)
- **Hedef proje:** Expo + TypeScript tabanlı React Native uygulaması → `~/AndroidStudioProjects/EvHaliRN`
- **Test cihazı:** Samsung Galaxy A53 (Android), bilgisayara **USB kablo** ile bağlı. Emülatör **kullanılmayacak**.
- **Android Studio ve Xcode kurulu değil.** Native build gerekirse **EAS Build** (bulut) kullanılacak.
- **Amaç:** İş mantığını ve kullanıcı akışlarını birebir korumak; UI'ı React Native'in doğal bileşenleriyle yeniden yazmak.

---

## 1. Hedef Teknoloji Yığını

Aşağıdaki seçimlerin dışına çıkma. Listede olmayan bir pakete ihtiyaç olursa önce bana sor.

| İhtiyaç | Paket |
|---|---|
| Çatı | Expo (güncel SDK) + TypeScript (`strict: true`) |
| Navigasyon | Expo Router |
| Sunucu verisi / cache | TanStack Query |
| HTTP istemcisi | fetch (gerekirse axios) |
| Uygulama durumu | Zustand |
| Stil | NativeWind |
| Model & doğrulama | Zod |
| Formlar | react-hook-form + @hookform/resolvers/zod |
| Anahtar-değer depolama | react-native-mmkv |
| Güvenli depolama (token vb.) | expo-secure-store |
| İlişkisel yerel veri | expo-sqlite (gerekirse) |
| Animasyon & jest | react-native-reanimated + react-native-gesture-handler |
| Uzun listeler | @shopify/flash-list |
| Çoklu dil | i18next + react-i18next + expo-localization |
| Birim/bileşen testi | Jest + React Native Testing Library |
| Uçtan uca test | Maestro |
| Lint / format | ESLint + Prettier |
| Build / dağıtım | EAS Build, EAS Update |

---

## 2. Genel Kurallar

- Paket kurarken **her zaman `npx expo install <paket>`** kullan (sürüm uyumu için), `npm install` değil.
- Flutter projesinde **hiçbir dosyayı değiştirme**, sadece oku.
- Tüm kod TypeScript; `any` kullanma. API yanıtları Zod şemalarıyla doğrulanmalı.
- Klasör yapısı **feature bazlı** olsun (aşağıya bak). Flutter'daki feature ayrımını koru.
- Sabit metin yazma; tüm kullanıcıya görünen metinler i18n dosyalarından gelsin.
- Gizli anahtarlar `.env` dosyasında (`EXPO_PUBLIC_` öneki sadece istemcide görünmesi sorun olmayanlar için).
- Her fazın sonunda: `npx tsc --noEmit`, `npm run lint` ve `npm test` hatasız geçmeli.
- Her fazın sonunda anlamlı bir git commit at (`feat: ...`, `chore: ...` formatında).
- Bir Flutter paketinin RN karşılığı yoksa veya platforma özel kod (MethodChannel) varsa **kendi başına çözüm uydurma**, durup bana sor.

### Hedef klasör yapısı

```
app/                    # Expo Router ekranları (sadece yönlendirme + ekran kabuğu)
src/
  features/<feature>/
    components/
    hooks/              # TanStack Query hook'ları, feature'a özel hook'lar
    store.ts            # Zustand (gerekiyorsa)
    api.ts
    schemas.ts          # Zod şemaları ve türetilen tipler
  shared/
    components/         # Button, Input, Card vb. ortak UI
    lib/                # api istemcisi, storage, query client
    theme/              # renkler, tipografi (Flutter ThemeData karşılığı)
    i18n/
  types/
```

---

## Faz 1 — Analiz (KOD YAZMA)

- [x] `pubspec.yaml` ve `lib/` klasörünü baştan sona incele.
- [x] Şunları içeren `docs/ANALYSIS.md` dosyası oluştur:
  - [x] Tüm ekranların listesi ve navigasyon ağacı (hangi ekrandan hangisine gidiliyor, parametreler)
  - [x] State management yaklaşımı (Bloc / Riverpod / Provider / GetX vb.) ve hangi state'in nerede tutulduğu
  - [x] API katmanı: base URL'ler, endpoint listesi, auth/token yönetimi, interceptor'lar, hata yönetimi
  - [x] Veri modelleri (freezed / json_serializable sınıfları) listesi
  - [x] Yerel depolama kullanımı (shared_preferences, Hive, sqflite vb.) ve saklanan anahtarlar
  - [x] Tema: renkler, fontlar, açık/koyu mod
  - [x] Çoklu dil desteği ve desteklenen diller
  - [x] Asset'ler (görseller, ikonlar, fontlar, animasyon dosyaları)
  - [x] Platforma özel kod, native entegrasyonlar, izinler (kamera, konum, bildirim vb.)
- [x] `docs/PACKAGE_MAPPING.md` oluştur: her Flutter paketi → RN/Expo karşılığı tablosu.
  Karşılığı olmayan veya development build gerektiren paketleri **ayrıca işaretle**.
- [x] Faz 3 için ekranları taşıma sırasına göre sırala (bağımlılığı en az olan önce).

**🛑 Dur ve analizi onayıma sun.**

---

## Faz 2 — Proje İskeleti

- [x] `~/AndroidStudioProjects/EvHaliRN` altında Expo + TypeScript projesi oluştur (`npx create-expo-app@latest`, TypeScript şablonu).
- [x] `tsconfig.json`'da `strict: true` ve `@/*` → `src/*` path alias'ı.
- [x] ESLint + Prettier kurulumu ve `lint`, `format`, `typecheck`, `test` script'leri.
- [x] Bölüm 1'deki paketleri kur ve yapılandır:
  - [x] NativeWind (tailwind.config, babel/metro ayarları)
  - [x] TanStack Query (`QueryClientProvider` kök layout'ta)
  - [x] Reanimated + Gesture Handler
  - [x] i18next (Flutter'daki dillerle aynı diller)
  - [x] MMKV ve expo-secure-store için `src/shared/lib/storage.ts` sarmalayıcısı
- [x] Jest + React Native Testing Library kurulumu, örnek bir test yazıp çalıştır.
- [x] Flutter'daki temayı `src/shared/theme/` ve `tailwind.config` içine aktar (renkler, fontlar, koyu mod).
- [x] Asset'leri (görseller, fontlar, ikonlar) kopyala; uygulama ikonu ve splash screen'i `app.json`'da ayarla.
- [x] Faz 1'deki navigasyon ağacına göre Expo Router'da **boş** ekran dosyalarını oluştur (sadece başlık gösteren placeholder).
- [x] `.env.example` dosyası oluştur.

**Cihazda doğrulama:**
- [ ] `adb devices` ile telefonun bağlı olduğunu kontrol et.
- [ ] `npx expo start --localhost` çalıştır ve `a` ile telefonda aç.
- [ ] Tüm placeholder ekranlar arasında gezinilebildiğini bana bildir.

**🛑 Dur ve onayımı bekle.**

---

## Faz 3 — Ortak Katman

- [x] `src/shared/lib/api.ts`: base URL, auth header ekleme, token yenileme, merkezi hata yönetimi (Flutter'daki interceptor mantığını birebir taşı).
  > REST API yok (ANALYSIS §3.1). Karşılığı: `src/shared/lib/firebase/` (`live-query.ts`: onSnapshot → TanStack cache;
  > `errors.ts`: hata kodu → Türkçe mesaj; `app-check.ts`: "interceptor" karşılığı App Check) +
  > `src/shared/lib/feedback.ts` (`useFeedbackMutation`, Flutter `runWithFeedback`).
- [x] Tüm veri modellerini Zod şemalarına çevir; tipleri `z.infer` ile türet. → `src/shared/schemas/`
- [x] Her şema için Flutter'daki örnek JSON ile doğrulama testi yaz.
  > Flutter'da JSON fixture yoktu; CLAUDE.md §3'teki gerçek doküman biçimleriyle yazıldı. Ek olarak
  > `normalizeName` (Türkçe I/İ), davet kodu ve `joinNames` iş kuralı testleri.
- [x] Auth akışı: token saklama (expo-secure-store), oturum durumu (Zustand), korumalı rotalar (Expo Router layout'unda yönlendirme).
  > Token **saklanmıyor**: RNFB oturumu kendisi kalıcı tutuyor, ikinci bir kopya gereksiz. Korumalı rota:
  > `app/_layout.tsx` → `Stack.Protected`. Giriş ekranında geçici çalışan bir düğme, Profil'de çıkış var.
- [x] Ortak UI bileşenleri: Flutter'da tekrar kullanılan widget'ların karşılıkları (Button, TextInput, Card, Loading, ErrorView, EmptyState vb.).
  > `AppText`, `Button`, `TextField`, `Card`, `LoadingBar`, `LoadingScreen`, `ErrorView`, `EmptyState`, `ToastHost` (SnackBar).
- [x] Ortak bileşenler için bileşen testleri.

**🛑 Dur ve onayımı bekle.**

---

## Faz 4 — Ekranların Taşınması

Faz 1'de belirlenen sırayla, **her seferinde tek bir feature** taşı. Her feature için:

- [ ] Flutter'daki ilgili dosyaları oku, iş mantığını çıkar.
- [ ] API çağrılarını TanStack Query hook'larına (`useQuery` / `useMutation`) çevir.
- [ ] Bloc/Riverpod/Provider state'ini: sunucu verisi ise TanStack Query'ye, istemci durumu ise Zustand'a taşı.
- [ ] Formları react-hook-form + Zod ile yeniden yaz; doğrulama kuralları Flutter'dakiyle aynı olsun.
- [ ] UI'ı NativeWind ile yeniden yaz; `ListView` → `FlashList`.
- [ ] Yükleniyor / hata / boş durumlarını ele al.
- [ ] Tüm metinleri i18n dosyalarına ekle.
- [ ] Bileşen ve hook testlerini yaz.
- [ ] Typecheck + lint + test geçsin, commit at.
- [ ] Telefonda test etmem için bana hangi akışı kontrol etmem gerektiğini söyle.

Feature listesi (Faz 1'den sonra doldurulacak):

- [x] auth (giriş, oturum, korumalı rotalar)
  > Oturum ve korumalı rotalar Faz 3'te geldi; burada Figma giriş ekranı + api/listener/ekran testleri.
- [x] home-onboarding (HomeGate durumları, ev oluştur / eve katıl)
- [x] shell + profile (sekmeler, tema, bildirim tercihi, yazı boyutu, çıkış, evden ayrıl)
- [x] home-dashboard (ev adı, durum kartı, davet kodu, üyeler)
- [x] shopping-list (liste, gruplama/filtre, işaretle + geri al, hızlı ekleme, çevrimdışı bandı)
- [ ] item-form (ekleme/düzenleme alt sayfası)
- [ ] notifications (OneSignal, Faz 5)

---

## Faz 5 — Native Özellikler ve Development Build

- [ ] Expo Go'da çalışmayan paketleri (ör. MMKV) belirle.
- [ ] `eas.json` oluştur; `development`, `preview`, `production` profilleri.
- [ ] `expo-dev-client` kur.
- [ ] `eas build --profile development --platform android` ile APK üret ve telefona kurulum adımlarını bana anlat.
- [ ] İzinleri (`app.json` → `android.permissions`) Flutter'daki `AndroidManifest.xml` ile karşılaştırıp eksiksiz ayarla.
- [ ] Bildirim, kamera, konum vb. native özellikleri taşı ve telefonda test ettir.

**🛑 Dur ve onayımı bekle.**

---

## Faz 6 — Test, Performans ve Yayın Hazırlığı

- [ ] Ana kullanıcı akışları için Maestro E2E testleri (giriş, ana akış, çıkış).
- [ ] Flutter ve RN uygulamasını özellik bazında karşılaştıran `docs/PARITY_CHECKLIST.md` oluştur; eksik kalan her şeyi listele.
- [ ] Performans kontrolü: gereksiz render'lar, büyük listeler, görsel boyutları.
- [ ] Hata izleme (ör. Sentry) önerisi — kurmadan önce bana sor.
- [ ] `production` profiliyle Android build.
- [ ] iOS için yapılması gerekenleri listele (Apple Developer hesabı, EAS iOS build, test cihazı).

---

## Faz Sonu Rapor Formatı

Her faz bittiğinde şu formatta kısa bir özet ver:

```
✅ Tamamlananlar:
⚠️ Karşılaşılan sorunlar / verdiğim kararlar:
❓ Onayını beklediğim konular:
📱 Telefonda test etmen gerekenler:
➡️ Sıradaki faz:
```
