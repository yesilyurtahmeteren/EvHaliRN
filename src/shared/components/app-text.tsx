import { Text, type TextProps } from 'react-native';

import {
  fontFamilies,
  typeScale,
  type ColorToken,
  type FontWeightName,
  type TypeRole,
} from '@/shared/theme';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';
import { useAppTheme } from '@/shared/theme/theme-provider';

export type AppTextProps = TextProps & {
  variant?: TypeRole;
  // Rolün varsayılan ağırlığını ezmek için (Android'de fontWeight değil,
  // ayrı font ailesi seçilir - bkz. CLAUDE.md "Font").
  weight?: FontWeightName;
  // Renk className yerine token ile verilir: NativeWind'de iki text-renk
  // sınıfı çakışınca hangisinin kazanacağı sınıf sırasına bağlı değil.
  tone?: ColorToken;
  className?: string;
};

// Uygulamadaki tüm metinler bundan geçer: M3 tipografi rolü + kullanıcının
// yazı boyutu çarpanı (useTextScaleStore). className yalnızca yerleşim için.
export function AppText({
  variant = 'body-md',
  weight,
  tone = 'on-surface',
  style,
  ...rest
}: AppTextProps) {
  const multiplier = useTextScaleStore((s) => s.multiplier);
  const { colors } = useAppTheme();
  const [fontSize, lineHeight, letterSpacing, roleWeight] = typeScale[variant];

  return (
    <Text
      {...rest}
      style={[
        {
          color: colors[tone],
          fontFamily: fontFamilies[weight ?? roleWeight],
          fontSize: fontSize * multiplier,
          lineHeight: lineHeight * multiplier,
          letterSpacing,
        },
        style,
      ]}
    />
  );
}
