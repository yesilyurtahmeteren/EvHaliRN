import { possessiveSuffix } from '@/shared/lib/turkish';
import { colorTokens, darkColors, lightColors, memberColorsFor, stableHash } from '@/shared/theme';

const tokens = require('../../../../docs/design/tokens.json') as {
  color: { light: Record<string, string>; dark: Record<string, string> };
};

describe("renk token'ları", () => {
  it("tasarım handoff'u tokens.json ile birebir aynı (iki tema)", () => {
    for (const token of colorTokens) {
      expect(lightColors[token].toLowerCase()).toBe(tokens.color.light[token].toLowerCase());
      expect(darkColors[token].toLowerCase()).toBe(tokens.color.dark[token].toLowerCase());
    }
    expect(Object.keys(tokens.color.light).sort()).toEqual([...colorTokens].sort());
  });
});

describe('üye renkleri', () => {
  it('aynı uid her zaman aynı pastel çifti alır', () => {
    expect(memberColorsFor('uid-123')).toEqual(memberColorsFor('uid-123'));
    expect(stableHash('abc')).toBe(stableHash('abc'));
  });

  it('hash negatif olmaz', () => {
    expect(stableHash('x'.repeat(500))).toBeGreaterThanOrEqual(0);
  });
});

describe('yüzde iyelik eki', () => {
  it.each([
    [82, 'si'],
    [71, 'i'],
    [50, 'si'],
    [60, 'ı'],
    [40, 'ı'],
    [30, 'u'],
    [10, 'u'],
    [100, 'ü'],
    [0, 'ı'],
    [3, 'ü'],
    [6, 'sı'],
    [9, 'u'],
  ])('%%%i -> %s', (n, suffix) => {
    expect(possessiveSuffix(n)).toBe(suffix);
  });
});
