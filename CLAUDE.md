# Ev Hali (React Native) — Proje Talimatı

Bu repo, `~/AndroidStudioProjects/EvHali` (Flutter) uygulamasının Expo + TypeScript taşımasıdır.
Adım planı: `docs/MIGRATION_TASKS.md` (her fazın sonunda dur, onay bekle). Analiz: `docs/ANALYSIS.md`,
paket eşlemesi: `docs/PACKAGE_MAPPING.md`.

## Kararlar (2026-09-24, kullanıcı onayıyla)
- Taşıma onaylandı. MIGRATION_TASKS.md'deki teknoloji yığını (Zustand, TanStack Query, NativeWind vb.),
  Flutter CLAUDE.md §2'deki "kullanılmayacaklar" listesinin **yerine** geçer.
- Flutter projesi **salt okunur**, hiçbir dosyası değiştirilmez.
- Firebase erişimi için `@react-native-firebase` kullanılacak (App Check Play Integrity ve offline
  persistence korunur). Bu yüzden development build şart, Expo Go kullanılmaz.
- Remote: `https://github.com/yesilyurtahmeteren/EvHaliRN.git` (main branch)

## Flutter CLAUDE.md'den aynen geçerli olanlar
- Güvenlik (§4) pazarlığa kapalı: uygulamaya sır gömülmez, tek güvenlik sınırı `firestore.rules`,
  kurallar gevşetilerek sorun çözülmez, bildirim istemciden gönderilmez, veri minimizasyonu uygulanır.
- Veri modeli (§3) ve güvenlik kuralları değişmez. RN uygulaması Flutter sürümüyle aynı Firestore'a
  aynı biçimde yazar.
- Başarı ölçütü: "süt bitti" 3 saniyede girilebilmeli.
- Kod İngilizce, kullanıcının gördüğü metinler Türkçe (i18n dosyasından).
- TODO bırakma, soru varsa sor.
