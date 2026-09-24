import {
  AppMotion,
  colorTokens,
  darkColors,
  hexToRgbChannels,
  lightColors,
  memberColorFor,
  paletteToCssVars,
  stableHash,
} from '@/shared/theme';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindConfig = require('../../../../tailwind.config.js') as { colorNames: string[] };

describe('color tokens', () => {
  it('tailwind renk adları colors.ts ile birebir aynı', () => {
    expect(tailwindConfig.colorNames).toEqual([...colorTokens]);
  });

  it('her iki palette de her token geçerli #RRGGBB', () => {
    for (const palette of [lightColors, darkColors]) {
      for (const token of colorTokens) {
        expect(palette[token]).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it('Flutter açık şemasının marka renkleri korunmuş', () => {
    expect(lightColors.primary).toBe('#325346');
    expect(lightColors.surface).toBe('#FCF9F3');
    expect(darkColors.surface).toBe('#0F1512');
  });

  it('hex -> "R G B" dönüşümü', () => {
    expect(hexToRgbChannels('#325346')).toBe('50 83 70');
    expect(paletteToCssVars(lightColors)['--color-on-primary']).toBe('255 255 255');
  });
});

describe('member colors', () => {
  it('aynı uid her zaman aynı rengi alır', () => {
    expect(memberColorFor('uid-123', 'light')).toBe(memberColorFor('uid-123', 'light'));
    expect(stableHash('abc')).toBe(stableHash('abc'));
  });

  it('hash negatif olmaz', () => {
    expect(stableHash('x'.repeat(500))).toBeGreaterThanOrEqual(0);
  });
});

describe('motion', () => {
  it('sönüm oranı katsayıya doğru çevriliyor', () => {
    // 0.9 * 2 * sqrt(700) ≈ 47.62
    expect(AppMotion.spatialDefault.damping).toBeCloseTo(47.62, 1);
    // oran 1 = kritik sönüm = 2 * sqrt(1600) = 80
    expect(AppMotion.effectsDefault.damping).toBeCloseTo(80, 5);
  });
});
