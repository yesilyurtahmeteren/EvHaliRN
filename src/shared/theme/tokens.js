// Tailwind yapılandırması (CommonJS) ile TypeScript tarafının ortak
// kullandığı boyut token'ları. Flutter lib/theme/spacing.dart, shapes.dart,
// typography.dart karşılığı. Renkler colors.ts'te (CSS değişkeni olarak
// tema anında değişiyor), bunlar ise temadan bağımsız sabitler.

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 36,
  xxl: 48,
  xxxl: 64,
  screen: 20,
  touch: 48,
  row: 64,
};

const radii = {
  xs: 8,
  sm: 16,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  full: 9999,
};

// Android'de değişken font ağırlık ekseni güvenilir olmadığı için her
// ağırlık ayrı dosya/aile (assets/fonts, app.json expo-font eklentisi).
const fontFamilies = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
};

// [fontSize, lineHeight, letterSpacing(px), ağırlık] - M3 rol adlarıyla.
const typeScale = {
  'display-lg': [32, 40, -0.64, 'bold'],
  'display-md': [29, 37, -0.58, 'bold'],
  'display-sm': [26, 34, -0.39, 'semibold'],
  'headline-lg': [26, 34, -0.39, 'semibold'],
  'headline-md': [20, 28, -0.2, 'semibold'],
  'headline-sm': [18, 24, 0, 'semibold'],
  'title-lg': [18, 24, 0, 'semibold'],
  'title-md': [16, 24, 0, 'semibold'],
  'title-sm': [14, 20, 0.14, 'semibold'],
  'body-lg': [16, 24, 0, 'regular'],
  'body-md': [14, 20, 0, 'regular'],
  'body-sm': [13, 18, 0, 'regular'],
  'label-lg': [14, 20, 0.14, 'semibold'],
  'label-md': [12, 16, 0.24, 'semibold'],
  'label-sm': [11, 14, 0.22, 'medium'],
};

module.exports = { spacing, radii, fontFamilies, typeScale };
