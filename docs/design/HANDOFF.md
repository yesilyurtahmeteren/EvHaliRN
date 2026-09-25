# Ev Hali — Geliştirici Handoff

Ev Hali, bir evin ortak alışveriş listesi uygulamasıdır. Hedef kitlede **yaşlı kullanıcılar** da var: büyük yazı, büyük dokunma alanları, simgenin yanında mutlaka yazı ve sade akış bu yüzden tasarımın temel kuralı.

## Bu paketteki dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `design/Main.dc.html` | **Tek doğruluk kaynağı.** Tüm ekranların işaretlemesi, inline stilleri, CSS animasyonları ve etkileşim mantığı (`renderVals()`, state). Ölçü ve renkleri buradan birebir kopyala. |
| `design/Icon.dc.html` | Uygulama ikonu sunumu. |
| `tokens.json` | Renk (aydınlık + koyu), tipografi, boyut, radius ve hareket token'ları. |
| `assets/logo-512.png` | Uygulama ikonu (yuvarlatılmış, şeffaf köşe). |
| `assets/logo-source-1254.png` | İkonun orijinal yüksek çözünürlüklü görseli (app icon setleri için). |
| `assets/avatar-zeynep.jpg` | Demo profil fotoğrafı. |

### `.dc.html` formatını okuma notu
- `{{isim}}` → `renderVals()` fonksiyonunun döndürdüğü değer.
- `<sc-if value="{{x}}">` → koşullu render. `<sc-for list="{{xs}}" as="it">` → döngü.
- `onClick="{{fn}}"` → `renderVals()` içindeki handler.
- `var(--x)` → tema token'ı (bkz. `<helmet><style>` içindeki `.eh` ve `.eh.dark`).
- Animasyonlar `<helmet><style>` içindeki `@keyframes` ve sınıflarda (`.rise`, `.pop`, `.sheet` …).
- Bu dosya **tarayıcıda doğrudan çalışmaz** (tasarım aracının runtime'ına bağlı). Spesifikasyon olarak oku, kendi stack'inde yeniden kur.

---

## 1. Genel yapı

- Tasarım boyutu: **390 × 844** (iPhone 14/15 sınıfı). Yatay kenar boşluğu 20px. Genişlik esnek olmalı; 360–430px arası düzgün görünmeli.
- **Sahte durum çubuğu veya klavye çizme.** Safe area inset'lerini kullan.
- Ekranlar: `login` → uygulama kabuğu (`list`, `home`, `profile`, `notifs`) + `İhtiyaç Ekle` alt sayfası (bottom sheet).
- Uygulama kabuğu: üstte sabit başlık (68px), ortada kayan içerik (alt boşluk 140px, nav'ın altında kalmasın), altta sabit nav (96px).

### Başlık (tüm uygulama ekranları)
Sol: 38px logo (radius 11) + ekran başlığı (20/800). Başlıklar: `Alışveriş Listesi`, `Evim`, `Profilim`, `Bildirimler`. Sağ: **çan** (48px) + profil fotoğrafı (40px, 48px dokunma alanı).
- Çanın üzerinde okunmamış sayısı rozeti var (21px, `badgeUnread`, beyaz 12/800, 2px `bg` kenarlığı). Okunmamış varsa çan her 3.2s'de bir sallanır (`bellRing`). Hepsi okununca rozet ve sallanma kaybolur.
- Bildirimler açıkken çanın zemini `mint` olur. Tekrar basınca önceki ekrana döner.

### Alt navigasyon
3 öğe: **Ev** (sol), **Liste** (orta, yükseltilmiş FAB 70px), **Profil** (sağ). Etiketler 15/700.
- Aktif sekme: ikonun arkasında `mint` hap (genişlik 40→64px, 300ms `easeOut`), renk `brand`. Pasif renk `ink2`.
- FAB: `btn` zemin, 5px `bg` kenarlık, liste ekranındayken `scale(1.06)`, basınca `scale(.92)` (spring).

---

## 2. Ekranlar

### 2.1 Giriş
Dikey ortalanmış: logo 156px (radius 42, yeşil gölge) → "Ev Hali" 46/800 `brand` → alt yazı 19px `ink2` → en altta **Google ile Giriş Yap** (64px, hap, `card` zemin, 2px `line` kenarlık) → "Bilgileriniz güvende" (kalkan ikonu).
- Butona basınca: spinner + "Giriş yapılıyor…", ~1.3s sonra `list` ekranı ve "Hoş geldiniz, Zeynep Hanım" toast'u. Yükleme sırasında tekrar basılamaz.
- Giriş animasyonu: logo `logoIn` (900ms spring, dönerek büyür) ve ardından sürekli hafif sallanma (`sway` 4s). Diğer öğeler sırayla `rise` ile gelir (gecikmeler 200–860ms).

### 2.2 Alışveriş Listesi (ana ekran)
1. **İlerleme kartı** (`card`, radius 28, padding 20):
   - Solda büyük sayı (44/800 `brand`) + "ihtiyaç bekliyor" (18/700). Sağda "3 / 8 alındı" (15/600 `ink2`).
   - Altında **16px yükseklikte ilerleme çubuğu**: iz `well`, dolgu `btn`, tam yuvarlak. Oran = alınan / toplam.
     - Açılışta 0'dan dolarak gelir (`grow` 1.3s `easeOut`, 300ms gecikme).
     - Oran değişince genişlik 900ms `cubic-bezier(.34,1.25,.64,1)` ile yaylanarak gider.
     - Dolgunun üzerinden 2.8s'de bir yarı saydam beyaz parıltı geçer (`shine`).
     - Sayı değiştiğinde 500ms `bump` (1 → 1.28 → 1, spring).
   - Altta yönlendirme: "Aldığınız ürünün yanındaki yuvarlağa dokunun." Her şey alınınca "Harika! Listedeki her şey alındı."
   - `role="progressbar"` + `aria-valuenow`.
2. **İhtiyaç Ekle** ana butonu: tam genişlik, 64px, radius 20, `btn`, beyaz 19/700, + ikonu. Alt sayfayı açar.
3. **Bölümlere göre gruplu liste.** 4 sabit kategori, sıra sabit, boş olan bölüm gösterilmez:
   | key | Etiket | İkon zemini / rengi | İkon |
   |---|---|---|---|
   | `food` | Gıda | `honey` / `honeyFg` | elma |
   | `clean` | Temizlik | `sky` / `skyFg` | parıltı |
   | `care` | Kişisel Bakım | `peach` / `peachFg` | damla |
   | `other` | Diğer | `well2` / `ink2` | kutu |
   - Bölüm başlığı: 40px ikon karesi (radius 12) + başlık 20/700 + sayı hapı.
   - Acil ürünler kendi bölümünün en üstüne çıkar.
   - **Ürün satırı** (min 76px, radius 20, `card`): solda 56px dokunma alanında 38px yuvarlak onay kutusu (3px `reed` kenarlık), ürün adı 18/700 (sarmalanır, kesilmez), alt satır "2 adet · Zeynep ekledi" 15px `ink2`, sağda gerekirse **Acil** hapı (`peach`/`peachFg`, alev ikonu).
4. **Alınanlar** (açılır bölüm, varsayılan kapalı): başlık satırı 60px, "Göster/Gizle" yazısı + dönen ok (180°, 350ms). Her satırda üstü çizili ad ve **Geri al** butonu (48px, yazılı).
5. **Boş durum:** bekleyen ürün yoksa logolu yüzen daire + "Hepsi alındı!" kartı.

**Ürünü alma etkileşimi (önemli):**
1. Onay kutusuna dokun → kutu `btn` ile dolar ve `scale(1.1)` olur (spring). Beyaz tik **çizilerek** gelir (stroke-dashoffset 24→0, 350ms). Ad üstü çizilir. Satır %55 opaklığa iner ve 10px sağa kayar.
2. 600ms sonra ürün "Alınanlar"a taşınır, sayaç `bump` yapar, çubuk ilerler.
- Geri al → ürün listenin başına döner ve 1.8s boyunca `brand` renkli bir halka ile vurgulanır (`flash`).

### 2.3 İhtiyaç Ekle (bottom sheet)
- Açılış: scrim fade (300ms) + `backdrop-filter: blur(5px)`. Sayfa alttan kayar (500ms `easeOut`). Kapanış 260ms `easeIn`. Scrim'e dokunmak veya **Kapat** butonu (yazılı, 48px) kapatır.
- Üst radius 32, tutma çubuğu 48×5.
- Alanlar (üstten alta; her birinin görünür etiketi var):
  1. **Ne lazım?** 60px input (19px yazı, 2px `reed` kenarlık, odakta `brand`) + sağda 48px **mikrofon** butonu (`mint`). Altında yatay kayan hızlı seçim hapları (Ekmek, Süt, Yumurta, Peçete, Deterjan, Şampuan). Haba basınca ad ve kategori dolar.
  2. **Ne kadar?** Solda stepper (− / sayı / +; butonlar 52px, sayı 22/800, min 1 max 99). Sağda **birim açılır listesi**: 60px buton, seçili birim + dönen ok.
     - Liste (`role="listbox"`) butonun altında, sağa hizalı açılır; 220px genişlik, radius 20, gölgeli. Animasyon: `dropIn` 280ms (translateY -8px + scale .94 → 1, origin sağ üst).
     - Seçenekler 52px: Adet, Kilogram (kg), Gram (g), Litre, Paket, Kutu. Seçili olan `mint` zeminli, kalın ve tikli. Seçince liste kapanır.
  3. **Hangi bölüm?** 2×2 grid, 58px karolar (ikon + etiket). Seçili karo: `mint` zemin + 2px `brand` kenarlık (`role="radio"`).
  4. **Acil İhtiyaç** satırı: 44px şeftali kutuda alev ikonu, "Acil İhtiyaç" / "Markete giden ilk kişi hemen görsün", sağda küçük switch (56×34; açıkken `urgentOn` #c46234).
  5. **Listeye Ekle**: 62px, `btn`, 19/800.
- Doğrulama: ad boşsa input 450ms **sallanır** (`shake`), ekleme yapılmaz.
- Başarılı ekleme: sayfa kapanır, ürün ilgili bölüme `flash` ile girer, sayaç `bump` yapar, toast "Süt listeye eklendi". Form sıfırlanır (1 adet, Gıda, acil değil).

### 2.4 Evim
- Karşılama kartı (`hero`): "Hoş geldiniz" / **Yılmaz Ailesi** 28/800 / "4 kişi aynı listeyi paylaşıyor". Sağ üstte yavaşça yüzen `mint` daire (dekoratif).
- Haftalık özet: 64px halka grafik (`accentHoney`, açılışta 1.4s dolarak gelir, %82) + "18 ihtiyaç alındı".
- **Aileyi davet et**: açıklama + büyük kod kutusu (`EV-8492-HL`, 28px monospace) + iki eşit buton: **Kopyala** (basınca 1.8s "Kopyalandı" ve tik, `mint` zemin) ve **Gönder** (paylaşım sayfası).
- Aile bireyleri: 52px avatar + ad 18/700 + rol. **Canlı durum/konum göstergesi YOK.**
- İpucu kartı (`tip`): "Sesle ekleyin".

### 2.5 Profilim
- Profil kartı: 108px fotoğraf + kamera butonu, ad, e-posta, "Ev yöneticisi" hapı, 3'lü istatistik (Kişi / Bekleyen / Bu hafta). İstatistikler ekran açılınca 0'dan sayar (900ms, ease-out cubic).
- **Görünüm**:
  - **Tema seçici**: iki büyük segment, **Aydınlık** (güneş) / **Koyu** (ay), 64px. Beyaz gösterge 550ms `softSpring` ile kayar. Güneş -90°, ay 60°→0° döner (800ms).
  - **Büyük yazı** switch'i: metin ölçeğini 1 → 1.14 yapar (450ms geçiş).
- Bildirim tercihleri: "Yeni eklenenler", "Alınanlar" switch'leri (64×38).
- Hesap: "Aile üyelerini yönet" (Evim'e gider), "Çıkış yap" (girişe döner), "Hesabı sil" (`dangerBg`/`dangerFg`; onay diyaloğu eklenmeli).
- **Harcama istatistikleri özelliği YOK** (bilinçli olarak kaldırıldı).

### 2.6 Bildirimler
- Üstte **Geri** (yazılı) ve okunmamış varsa **Hepsini okudum**. Altında "3 yeni bildiriminiz var."
- "Bugün" / "Dün" grupları. Kart: 48px ikon dairesi (türe göre renk), kalın kişi adı + metin (17px), zaman (14px `ink2`).
- Okunmamış kart: 2px `brand` kenarlık + sağda 12px turuncu nokta. Dokununca okundu olur; nokta küçülerek kaybolur (300ms spring).
- Türler: `cart` (aldı), `person` (ekledi/katıldı), `clock` (hatırlatma), `chart` (haftalık özet). **Canlı konum ("markete girdi") bildirimi YOK.**

---

## 3. Tema (aydınlık ↔ koyu), en önemli animasyon

- Tüm renkler token. Her bileşen yalnızca token kullanır; sabit renkler yalnızca `tokens.json > color.fixed` içindekiler.
- Geçiş **800ms ease** ile, bütün renkler aynı anda yumuşakça akar (arka plan, kartlar, yazı, kenarlık, gölge rengi).
  - Web: CSS custom property'leri `@property` ile `<color>` tipinde kaydet ve kök elemanda `transition` ver (bkz. `Main.dc.html` → `.eh`). Böylece her eleman tek tek transition istemeden geçer.
  - React Native: `useAnimatedStyle` / `interpolateColor` (Reanimated) ile tek bir `progress` değerinden tüm renkleri türet.
  - Flutter: `AnimatedTheme` veya `ThemeData.lerp` + 800ms.
- Tema seçimi kalıcı olmalı. İlk açılışta sistem temasını izle.

## 4. Hareket kataloğu

| Öğe | Tetik | Animasyon | Süre | Easing |
|---|---|---|---|---|
| Ekran içeriği | Ekran değişimi | opacity 0→1, translateY 14→0 | 420ms | easeOut |
| Kart/satır girişleri | Mount | `rise`: opacity, translateY 16, scale .98 | 550ms, 70ms kademeli | easeOut |
| Başlık metni | Ekran değişimi | `pop` scale .4→1.1→1 | 600ms | spring |
| Onay kutusu | Dokunma | dolgu + scale 1.1 + tik çizimi | 300–350ms | spring |
| Alınan satır | Dokunma | opacity .55, translateX 10, sonra taşı | 600ms | ease |
| İlerleme çubuğu | Mount / değişim | genişlik | 1300 / 900ms | easeOut / `.34,1.25,.64,1` |
| Sayaç | Değişim | scale 1→1.28→1 | 500ms | spring |
| Bottom sheet | Aç / kapa | translateY 100%↔0 + scrim | 500 / 260ms | easeOut / easeIn |
| Birim listesi | Aç | translateY -8 + scale .94 | 280ms | easeOut |
| Switch topuzu | Değişim | translateX | 450ms | `.34,1.4,.64,1` |
| Tema segmenti | Değişim | translateX %100 | 550ms | softSpring |
| Tema renkleri | Değişim | tüm renk token'ları | 800ms | ease |
| Çan | Okunmamış > 0 | salınım, döngü | 3.2s | ease-in-out |
| Toast | Olay | alttan girer, 2.6s sonra kaybolur | 2600ms | easeOut |
| Input hatası | Boş gönderim | yatay sallanma | 450ms | linear |
| Basma geri bildirimi | :active | scale .96 | 150ms | ease |

**`prefers-reduced-motion` / sistemde "hareketi azalt"**: tüm animasyonlar anlık olmalı, döngüler durmalı.

## 5. Erişilebilirlik (zorunlu)
- Dokunma hedefi **min 48px**; ana aksiyonlar 56–64px.
- Metin kontrastı ≥ 4.5:1 (token'lar iki temada da buna göre seçildi, açık gri yazı kullanma).
- Sadece ikondan oluşan buton yok gibi davran: ya görünür yazı ya `aria-label`/`accessibilityLabel`. Örnekler: onay kutusu → "Süt: aldım olarak işaretle", geri al → "Süt listeye geri al".
- Switch'ler `role="switch"` + `aria-checked`, tema `radiogroup`, bölüm karoları `radio`, birim listesi `listbox`/`option`.
- Toast'lar `role="status"` ile okunmalı. Stepper sayısı `aria-live="polite"`.
- Odak sırası görsel sırayı takip eder. Bottom sheet açılınca odak sayfaya, kapanınca açan butona döner.
- "Büyük yazı" ve sistem yazı boyutu (Dynamic Type) desteklenmeli. Satırlar yüksekliğe göre büyümeli, metin kesilmemeli.

## 6. Kenar durumları
- Uzun ürün adı: 2 satıra kadar sarmalanır, sonra `…`.
- 99'dan büyük miktar yok. Birim yoksa alt satırda yalnızca "X ekledi".
- Çevrimdışı: eklemeler yerelde kuyruklanır (tasarımda görünür bir gösterge yok; gerekirse üst başlığın altına ince bir bant önerilir).
- Bildirim yoksa: "Hepsini okudunuz." metni.
- Hesabı sil: onay diyaloğu ister (tasarımda henüz yok).

## 7. Bilinçli olarak OLMAYANLAR
- Canlı konum / "markette" durumu / çevrimiçi noktaları / nabız animasyonları
- Harcama istatistikleri
- Kategori filtre çipleri (yerine gruplu liste var)
