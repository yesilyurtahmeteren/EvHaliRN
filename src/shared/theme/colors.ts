// Tasarım handoff'u (2026-09-25) tokens.json > color. Aydınlık ve koyu
// paletler birebir; bileşenler yalnızca bu token'ları kullanır. Sabit
// renkler (temadan bağımsız) fixedColors'ta.
//
// Tema geçişi 800 ms'de tüm renkleri aynı anda akıtır: ThemeProvider tek bir
// progress (0 = aydınlık, 1 = koyu) değerini canlandırır, bileşenler rengi bu
// değerden interpolateColor ile türetir (bkz. use-theme-color.ts).

export const colorTokens = [
  'bg',
  'card',
  'well',
  'well2',
  'soft',
  'line',
  'reed',
  'ink',
  'ink2',
  'muted',
  'brand',
  'btn',
  'mint',
  'mintFg',
  'peach',
  'peachFg',
  'honey',
  'honeyFg',
  'sky',
  'skyFg',
  'hero',
  'tip',
  'dangerBg',
  'dangerFg',
  'header',
  'nav',
  'shadow',
  'scrim',
  'toastBg',
  'toastFg',
] as const;

export type ColorToken = (typeof colorTokens)[number];
export type Palette = Record<ColorToken, string>;

export const lightColors: Palette = {
  bg: '#fbf8f1',
  card: '#ffffff',
  well: '#f0ede5',
  well2: '#e9e5dc',
  soft: '#f6f3ed',
  line: '#e5e2dc',
  reed: '#cfc9bb',
  ink: '#1c1c18',
  ink2: '#3d433f',
  muted: '#5f6661',
  brand: '#1d5a3f',
  btn: '#1d5a3f',
  mint: '#d4e9dc',
  mintFg: '#174a33',
  peach: '#ffdccb',
  peachFg: '#8f3d1b',
  honey: '#fde6bf',
  honeyFg: '#664000',
  sky: '#dde9f3',
  skyFg: '#23486a',
  hero: '#e6efe8',
  tip: '#fbece2',
  dangerBg: '#ffdad6',
  dangerFg: '#93000a',
  header: 'rgba(251,248,241,0.95)',
  nav: '#ffffff',
  shadow: 'rgba(29,90,63,0.09)',
  scrim: 'rgba(28,28,24,0.36)',
  toastBg: '#1f2a24',
  toastFg: '#f3f0ea',
};

export const darkColors: Palette = {
  bg: '#121815',
  card: '#1c2420',
  well: '#242d28',
  well2: '#2b3530',
  soft: '#1f2823',
  line: '#333d37',
  reed: '#56615a',
  ink: '#eef1ec',
  ink2: '#c9d1cb',
  muted: '#a2aca5',
  brand: '#93d6b1',
  btn: '#2f7d58',
  mint: '#1f3b2c',
  mintFg: '#b9ead0',
  peach: '#45271a',
  peachFg: '#ffbf9f',
  honey: '#3f321a',
  honeyFg: '#f3cf8a',
  sky: '#1d2d3b',
  skyFg: '#b7d4ec',
  hero: '#192a21',
  tip: '#2a211b',
  dangerBg: '#45201e',
  dangerFg: '#ffb4ab',
  header: 'rgba(18,24,21,0.95)',
  nav: '#1a221e',
  shadow: 'rgba(0,0,0,0.45)',
  scrim: 'rgba(0,0,0,0.55)',
  toastBg: '#eef1ec',
  toastFg: '#1c1c18',
};

// Temadan bağımsız renkler (tokens.json > color.fixed + Main.dc.html'de
// sabit yazılmış birkaç değer).
export const fixedColors = {
  accentHoney: '#f2a93b',
  urgentOn: '#c46234',
  badgeUnread: '#b8532a',
  onBtn: '#ffffff',
  sun: '#e0932a',
  toastCheck: '#1f2a24',
  primaryShadow: 'rgba(29,90,63,0.55)',
} as const;
