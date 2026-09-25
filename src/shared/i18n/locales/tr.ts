// Flutter lib/strings.dart karşılığı. Metinler feature feature taşındıkça
// (MIGRATION_TASKS Faz 4) buraya eklenir.
const tr = {
  common: {
    appName: 'Ev Hali',
    retry: 'Tekrar dene',
    cancel: 'Vazgeç',
    confirm: 'Onayla',
    loading: 'Yükleniyor',
    // joinNames birleştiricisi: "A, B ve C".
    and: 've',
  },
  errors: {
    generic: 'Bir şeyler ters gitti, tekrar dene.',
    permissionDenied: 'Bu işlem için yetkin yok görünüyor, tekrar giriş yapmayı dene.',
  },
  auth: {
    signInWithGoogle: 'Google ile Devam Et',
    signInError: 'Giriş yapılamadı, tekrar deneyin.',
    signInSubtitle: 'Evinizin ortak alışveriş listesi ve aile bereketi',
    signInTrustCaption: 'Ailece güvenli ve senkronize alışveriş deneyimi',
    signOut: 'Çıkış Yap',
  },
  home: {
    loadError: 'Ev bilgisi yüklenemedi. Bağlantını kontrol edip uygulamayı yeniden aç.',
  },
  onboarding: {
    title: 'Ev Oluştur',
    createHomeDescription: 'Alışveriş listesini paylaşacağın bir ev oluştur.',
    homeNameLabel: 'Ev adı',
    createHomeButton: 'Ev Oluştur',
    createHomeError: 'Ev oluşturulamadı, tekrar deneyin.',
    orDivider: 'veya',
    joinHomeDescription: 'Bir davet kodun varsa eve katıl.',
    inviteCodeLabel: 'Davet kodu',
    joinHomeButton: 'Eve Katıl',
    invalidInviteCode: 'Geçersiz davet kodu.',
  },
  dashboard: {
    greeting: 'Hoş Geldiniz',
    subtitle: 'Ortak pazar ve mutfak planınız',
    editHomeName: 'Ev adını düzenle',
    homeNameLabel: 'Ev adı',
    saveHomeName: 'Kaydet',
    renameHomeSuccess: 'Ev adı güncellendi.',
    renameHomeError: 'Ev adı güncellenemedi, tekrar deneyin.',
    statusCardTitle: 'Durum',
    statusCardBody: '{{bought}} tamamlandı, {{needed}} bekleyen ürün',
    inviteCodeSectionTitle: 'Davet Kodu',
    shareInviteCode: 'Paylaş',
    copyInviteCode: 'Kopyala',
    inviteCodeCopied: 'Davet kodu kopyalandı.',
    inviteShareMessage: "Ev Hali'nde ortak alışveriş listemize katıl. Davet kodu: {{code}}",
    regenerateInviteCode: 'Kodu Yenile',
    regenerateInviteCodeConfirmTitle: 'Kodu yenile?',
    regenerateInviteCodeConfirmBody:
      'Eski kod artık çalışmayacak. Bu kodu daha önce paylaştıysan onunla eve katılınamaz.',
    regenerateInviteCodeSuccess: 'Davet kodu yenilendi.',
    membersSectionTitle: 'Aile Bireyleri',
    youLabel: 'Sen',
  },
  profile: {
    appearanceSectionTitle: 'Görünüm & Tercihler',
    darkModeLabel: 'Karanlık Mod',
    darkModeOnSubtitle: 'Karanlık tema',
    darkModeOffSubtitle: 'Sıcak İskandinav aydınlık tema',
    notificationsSectionTitle: 'Bildirim Tercihleri',
    notificationsEnabledLabel: 'Yeni ürün eklendiğinde bildir',
    textScaleSectionTitle: 'Yazı Boyutu',
    textScaleSmall: 'Küçük',
    textScaleNormal: 'Normal',
    textScaleLarge: 'Büyük',
    textScaleExtraLarge: 'Çok büyük',
    textScalePreviewLabel: 'Örnek: Süt · 2 adet',
    accountSecuritySectionTitle: 'Hesap & Güvenlik',
    leaveHome: 'Evden Ayrıl',
    leaveHomeConfirmTitle: 'Evden ayrıl?',
    leaveHomeConfirmBody:
      'Bu evin listesine artık erişemeyeceksin. İstersen daha sonra davet koduyla tekrar katılabilirsin.',
    leaveHomeError: 'Evden ayrılamadın, tekrar deneyin.',
  },
  nav: {
    home: 'Ev',
    shopping: 'Alışveriş',
    profile: 'Profil',
  },
  screens: {
    itemForm: 'İhtiyaç Ekle',
  },
  dev: {
    placeholder: 'Bu ekran henüz taşınmadı.',
    goTo: 'Ekranlar',
    close: 'Kapat',
  },
} as const;

export default tr;
