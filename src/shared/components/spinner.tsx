import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAppTheme } from '@/shared/theme/theme-provider';

// Main.dc.html giriş düğmesindeki dönen halka (.spin, 0.8 s doğrusal).
export function Spinner({ size = 24 }: { size?: number }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.linear }), -1);
    return () => cancelAnimation(turn);
  }, [turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Animated.View
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.loading')}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={colors.line} strokeWidth={3} />
        <Path
          d="M21 12a9 9 0 0 0-9-9"
          stroke={colors.brand}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}
