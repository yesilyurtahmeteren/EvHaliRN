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
  nav: {
    home: 'Ev',
    shopping: 'Alışveriş',
    profile: 'Profil',
  },
  screens: {
    signIn: 'Giriş',
    createHome: 'Ev Oluştur',
    itemForm: 'İhtiyaç Ekle',
  },
  dev: {
    placeholder: 'Bu ekran henüz taşınmadı.',
    goTo: 'Ekranlar',
    close: 'Kapat',
  },
} as const;

export default tr;
