// Flutter lib/theme/color_scheme.dart + ev_hali_colors.dart karşılığı.
// Açık şema DESIGN.md'den birebir; koyu şema Flutter'ın
// ColorScheme.fromSeed(#446557, dark) çıktısından bir kez üretilip sabitlendi
// (Flutter 3.47.4, 2026-09-24) - çalışma anında türetilmiyor.

export const colorTokens = [
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'tertiary',
  'on-tertiary',
  'tertiary-container',
  'on-tertiary-container',
  'error',
  'on-error',
  'error-container',
  'on-error-container',
  'surface',
  'on-surface',
  'on-surface-variant',
  'surface-dim',
  'surface-bright',
  'surface-container-lowest',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
  'outline',
  'outline-variant',
  'shadow',
  'scrim',
  'inverse-surface',
  'on-inverse-surface',
  'inverse-primary',
  'surface-tint',
  // M3 şemasında karşılığı olmayan ürün renkleri (EvHaliColors).
  'bought-strikethrough',
  'category-header-bg',
  'invite-code-bg',
  'offline-banner',
  'on-offline-banner',
  'delete-swipe-bg',
  'on-delete-swipe',
  'pending-write-icon',
] as const;

export type ColorToken = (typeof colorTokens)[number];
export type Palette = Record<ColorToken, string>;

export const lightColors: Palette = {
  primary: '#325346',
  'on-primary': '#FFFFFF',
  'primary-container': '#4A6B5D',
  'on-primary-container': '#C6EAD8',
  secondary: '#964824',
  'on-secondary': '#FFFFFF',
  'secondary-container': '#FD9A6F',
  'on-secondary-container': '#76300D',
  tertiary: '#644800',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#805F15',
  'on-tertiary-container': '#FFDEA3',
  error: '#BA1A1A',
  'on-error': '#FFFFFF',
  'error-container': '#FFDAD6',
  'on-error-container': '#93000A',
  surface: '#FCF9F3',
  'on-surface': '#1C1C18',
  'on-surface-variant': '#414844',
  'surface-dim': '#DCDAD4',
  'surface-bright': '#FCF9F3',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#F6F3ED',
  'surface-container': '#F0EEE8',
  'surface-container-high': '#EBE8E2',
  'surface-container-highest': '#E5E2DC',
  outline: '#727974',
  'outline-variant': '#C1C8C3',
  shadow: '#000000',
  scrim: '#000000',
  'inverse-surface': '#31312D',
  'on-inverse-surface': '#F3F0EA',
  'inverse-primary': '#ABCEBE',
  'surface-tint': '#446557',
  'bought-strikethrough': '#606B63',
  'category-header-bg': '#F6F3ED',
  'invite-code-bg': '#EFECE4',
  'offline-banner': '#805F15',
  'on-offline-banner': '#FFDEA3',
  'delete-swipe-bg': '#964824',
  'on-delete-swipe': '#FFFFFF',
  'pending-write-icon': '#727974',
};

export const darkColors: Palette = {
  primary: '#8AD6B7',
  'on-primary': '#003828',
  'primary-container': '#00513C',
  'on-primary-container': '#A6F2D2',
  secondary: '#B3CCBF',
  'on-secondary': '#1E352C',
  'secondary-container': '#354C42',
  'on-secondary-container': '#CEE9DB',
  tertiary: '#A6CCE0',
  'on-tertiary': '#0A3545',
  'tertiary-container': '#264B5C',
  'on-tertiary-container': '#C2E8FD',
  error: '#FFB4AB',
  'on-error': '#690005',
  'error-container': '#93000A',
  'on-error-container': '#FFDAD6',
  surface: '#0F1512',
  'on-surface': '#DEE4DF',
  'on-surface-variant': '#BFC9C2',
  'surface-dim': '#0F1512',
  'surface-bright': '#343B37',
  'surface-container-lowest': '#0A0F0D',
  'surface-container-low': '#171D1A',
  'surface-container': '#1B211E',
  'surface-container-high': '#252B28',
  'surface-container-highest': '#303633',
  outline: '#89938D',
  'outline-variant': '#404944',
  shadow: '#000000',
  scrim: '#000000',
  'inverse-surface': '#DEE4DF',
  'on-inverse-surface': '#2C322E',
  'inverse-primary': '#1A6B52',
  'surface-tint': '#8AD6B7',
  'bought-strikethrough': '#C1C8C3',
  'category-header-bg': '#2A2A26',
  'invite-code-bg': '#35352F',
  'offline-banner': '#EBC06D',
  'on-offline-banner': '#3F2E00',
  'delete-swipe-bg': '#D97D54',
  'on-delete-swipe': '#3D1500',
  'pending-write-icon': '#8D948F',
};

// "#RRGGBB" -> "R G B": Tailwind'in rgb(var(--x) / <alpha-value>) kalıbı için.
export function hexToRgbChannels(hex: string): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function paletteToCssVars(palette: Palette): Record<`--color-${ColorToken}`, string> {
  const entries = colorTokens.map(
    (token) => [`--color-${token}`, hexToRgbChannels(palette[token])] as const,
  );
  return Object.fromEntries(entries) as Record<`--color-${ColorToken}`, string>;
}
