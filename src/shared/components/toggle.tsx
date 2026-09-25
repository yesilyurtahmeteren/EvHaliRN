import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { darkColors, Durations, Ease, lightColors } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { colorPair, type ColorValue } from '@/shared/theme/use-theme-color';

// Main.dc.html anahtarı (role="switch"): kapalıyken `reed`, açıkken `btn`
// (Acil İhtiyaç'ta sabit `urgentOn`). Topuz 450 ms `.34,1.4,.64,1` ile kayar.
//   normal: 64x38, topuz 30, yol 26   küçük: 56x34, topuz 26, yol 22
export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
  small = false,
  onColor = 'btn',
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
  small?: boolean;
  onColor?: ColorValue;
}) {
  const { progress } = useAppTheme();
  const on = useSharedValue(value ? 1 : 0);
  const [onLight, onDark] = colorPair(onColor);
  const width = small ? 56 : 64;
  const height = small ? 34 : 38;
  const knob = small ? 26 : 30;
  const travel = small ? 22 : 26;

  useEffect(() => {
    on.value = withTiming(value ? 1 : 0, { duration: Durations.knob, easing: Ease.knob });
  }, [on, value]);

  const trackStyle = useAnimatedStyle(() => {
    const off = interpolateColor(progress.value, [0, 1], [lightColors.reed, darkColors.reed]);
    const onC = interpolateColor(progress.value, [0, 1], [onLight, onDark]);
    // Renk topuzla aynı anda ama taşmadan değişir.
    return {
      backgroundColor: interpolateColor(Math.min(1, Math.max(0, on.value)), [0, 1], [off, onC]),
    };
  });
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * travel }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={{ top: 6, bottom: 6 }}
    >
      <Animated.View style={[{ width, height, borderRadius: height / 2 }, trackStyle]}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 4,
              top: 4,
              width: knob,
              height: knob,
              borderRadius: knob / 2,
              backgroundColor: '#ffffff',
              boxShadow: small ? '0px 1px 4px rgba(0,0,0,0.15)' : '0px 1px 4px rgba(0,0,0,0.2)',
            },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
