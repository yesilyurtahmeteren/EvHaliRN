import type { TextProps, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { fontFamilies, type FontWeightName } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { useThemedStyle, type ColorValue } from '@/shared/theme/use-theme-color';

export type AppTextProps = Omit<TextProps, 'style'> & {
  // Main.dc.html'deki px değerleri birebir.
  size?: number;
  weight?: FontWeightName;
  // Satır yüksekliği: px (>= 4) ya da oran (< 4, ör. 1.5).
  lineHeight?: number;
  // Harf aralığı em cinsinden (ör. -0.03).
  tracking?: number;
  tone?: ColorValue;
  // Tasarımda calc(Npx * var(--ts)) olan metinler: "Büyük yazı" açıkken
  // 1.14 kat büyür (450 ms'de akarak). Sistem yazı boyutu her metne ayrıca
  // uygulanır (allowFontScaling).
  scaled?: boolean;
  strike?: boolean;
  style?: TextStyle | TextStyle[];
  className?: string;
};

// Uygulamadaki tüm metinler bundan geçer. Renk tema geçişinde akar.
export function AppText({
  size = 16,
  weight = 'regular',
  lineHeight,
  tracking,
  tone = 'ink',
  scaled = false,
  strike = false,
  style,
  ...rest
}: AppTextProps) {
  const { textScale } = useAppTheme();
  const colorStyle = useThemedStyle({ color: tone });
  const lineHeightPx =
    lineHeight === undefined ? undefined : lineHeight < 4 ? size * lineHeight : lineHeight;

  const scaleStyle = useAnimatedStyle(() => {
    if (!scaled) {
      return {};
    }
    return {
      fontSize: size * textScale.value,
      ...(lineHeightPx === undefined ? {} : { lineHeight: lineHeightPx * textScale.value }),
    };
  }, [scaled, size, lineHeightPx]);

  return (
    <Animated.Text
      {...rest}
      style={[
        {
          fontFamily: fontFamilies[weight],
          fontSize: size,
          lineHeight: lineHeightPx,
          letterSpacing: tracking === undefined ? undefined : tracking * size,
          textDecorationLine: strike ? 'line-through' : 'none',
        },
        colorStyle,
        scaleStyle,
        style,
      ]}
    />
  );
}
