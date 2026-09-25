import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { darkColors, Durations, Ease, lightColors } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Main.dc.html ürün satırı onay kutusu: 56 px dokunma alanında 38 px daire,
// 3 px `reed` kenarlık, `card` zemin. İşaretlenince `btn` ile dolar ve
// scale(1.1) olur (300 ms renk, 350 ms spring), beyaz tik çizilerek gelir
// (stroke-dashoffset 24 -> 0, 350 ms, 80 ms gecikme).
export function Checkbox({
  checked,
  disabled = false,
  onPress,
  accessibilityLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const { progress } = useAppTheme();
  const fill = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(checked ? 1.1 : 1);
  const dash = useSharedValue(checked ? 0 : 24);

  useEffect(() => {
    fill.value = withTiming(checked ? 1 : 0, { duration: Durations.checkbox, easing: Ease.ease });
    scale.value = withTiming(checked ? 1.1 : 1, { duration: Durations.tick, easing: Ease.spring });
    dash.value = checked
      ? withDelay(80, withTiming(0, { duration: Durations.tick, easing: Ease.ease }))
      : withTiming(24, { duration: Durations.tick, easing: Ease.ease });
  }, [checked, dash, fill, scale]);

  const circleStyle = useAnimatedStyle(() => {
    const card = interpolateColor(progress.value, [0, 1], [lightColors.card, darkColors.card]);
    const reed = interpolateColor(progress.value, [0, 1], [lightColors.reed, darkColors.reed]);
    const btn = interpolateColor(progress.value, [0, 1], [lightColors.btn, darkColors.btn]);
    return {
      backgroundColor: interpolateColor(fill.value, [0, 1], [card, btn]),
      borderColor: interpolateColor(fill.value, [0, 1], [reed, btn]),
      transform: [{ scale: scale.value }],
    };
  });
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: dash.value }));

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      className="h-[56px] w-[56px] items-center justify-center"
    >
      <Animated.View
        style={[
          { width: 38, height: 38, borderRadius: 19, borderWidth: 3 },
          { alignItems: 'center', justifyContent: 'center' },
          circleStyle,
        ]}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <AnimatedPath
            d="m5 12.5 4.5 4.5L19 7.5"
            fill="none"
            stroke="#ffffff"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={24}
            animatedProps={tickProps}
          />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}
