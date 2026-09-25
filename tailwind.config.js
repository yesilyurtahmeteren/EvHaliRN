const { spacing, radii, fontFamilies } = require('./src/shared/theme/tokens');

const px = (map) => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, `${v}px`]));

// Yalnızca yerleşim (boşluk, köşe, font ailesi). Renkler Tailwind sınıfı
// değil: tema geçişinde 800 ms akabilmeleri için Reanimated stilleriyle
// verilir (src/shared/theme/use-theme-color.ts).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      spacing: px(spacing),
      borderRadius: px(radii),
      fontFamily: Object.fromEntries(Object.entries(fontFamilies).map(([k, v]) => [k, [v]])),
    },
  },
  plugins: [],
};
