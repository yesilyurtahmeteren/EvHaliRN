const { spacing, radii, fontFamilies, typeScale } = require('./src/shared/theme/tokens');

// Renk adları src/shared/theme/colors.ts'teki colorTokens ile aynı olmalı
// (test/theme.test.ts bunu doğruluyor). Değerler CSS değişkeninden gelir;
// ThemeProvider açık/koyu paleti kök View'a vars() ile basar.
const colorNames = [
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
  'bought-strikethrough',
  'category-header-bg',
  'invite-code-bg',
  'offline-banner',
  'on-offline-banner',
  'delete-swipe-bg',
  'on-delete-swipe',
  'pending-write-icon',
];

const px = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, `${v}px`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(
        colorNames.map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`]),
      ),
      spacing: px(spacing),
      borderRadius: px(radii),
      fontFamily: Object.fromEntries(Object.entries(fontFamilies).map(([k, v]) => [k, [v]])),
      fontSize: Object.fromEntries(
        Object.entries(typeScale).map(([role, [size, lineHeight, letterSpacing]]) => [
          role,
          [`${size}px`, { lineHeight: `${lineHeight}px`, letterSpacing: `${letterSpacing}px` }],
        ]),
      ),
    },
  },
  plugins: [],
  colorNames,
};
