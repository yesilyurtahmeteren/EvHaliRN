import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { useThemedStyle, type ColorValue } from '@/shared/theme/use-theme-color';

export type BoxProps = Omit<ViewProps, 'style'> & {
  bg?: ColorValue;
  border?: ColorValue;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  className?: string;
  children?: ReactNode;
};

// Zemin/kenarlık rengi temayla birlikte akan View. Yerleşim className ya da
// style ile verilir; renk yalnızca token ile.
export function Box({ bg, border, style, ...rest }: BoxProps) {
  const colors = useThemedStyle({ backgroundColor: bg, borderColor: border });
  return <Animated.View {...rest} style={[colors, style]} />;
}
