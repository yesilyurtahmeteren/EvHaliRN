// Tailwind yapılandırması (CommonJS) ile TypeScript tarafının ortak
// kullandığı boyut token'ları: tasarım handoff'u tokens.json > radius,
// spacing, size. Renkler colors.ts'te (tema geçişinde akan değerler olduğu
// için Tailwind sınıfı olarak değil, use-theme-color.ts ile verilir).

const spacing = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 16,
  xxl: 20,
  section: 24,
  screen: 20,
  touch: 48,
};

const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  sheet: 32,
  full: 9999,
};

// Android'de değişken font ağırlık ekseni güvenilir olmadığı için her
// ağırlık ayrı dosya/aile (assets/fonts, app.json expo-font eklentisi).
const fontFamilies = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
};

const sizes = {
  headerHeight: 68,
  bottomNavHeight: 96,
  fab: 70,
  touchMin: 48,
  primaryButton: 64,
  listRowMin: 76,
  checkbox: 38,
  // İçerik alttaki gezinme çubuğunun altında kalmasın (HANDOFF §1).
  contentBottom: 140,
};

module.exports = { spacing, radii, fontFamilies, sizes };
