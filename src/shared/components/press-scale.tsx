import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

import { Durations, Ease } from '@/shared/theme';
import { useThemedStyle, type ColorValue } from '@/shared/theme/use-theme-color';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  bg?: ColorValue;
  border?: ColorValue;
  // Basılıyken ölçek (.press = .96, FAB = .92).
  pressedScale?: number;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  className?: string;
  children?: ReactNode;
};

// Main.dc.html ".press": basılıyken scale(.96), 150 ms ease. Zemin ve
// kenarlık rengi temayla akar.
export function PressScale({
  bg,
  border,
  pressedScale = 0.96,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressScaleProps) {
  const scale = useSharedValue(1);
  const colors = useThemedStyle({ backgroundColor: bg, borderColor: border });
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        scale.set(withTiming(pressedScale, { duration: Durations.press, easing: Ease.ease }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withTiming(1, { duration: Durations.press, easing: Ease.ease }));
        onPressOut?.(event);
      }}
      style={[colors, scaleStyle, style]}
    />
  );
}
