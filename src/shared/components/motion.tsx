// Main.dc.html'deki giriş animasyonları (.rise, .scr, .pop, .floaty) ve
// vurgu halkası (.flash). "Hareketi azalt" açıkken Reanimated zamanlı
// animasyonları anında bitirir; sonsuz döngüler hiç başlatılmaz.
import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

import { Durations, Ease } from '@/shared/theme';
import { useThemedStyle } from '@/shared/theme/use-theme-color';

type WrapperProps = {
  delay?: number;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  className?: string;
  children?: ReactNode;
};

// .rise: opacity 0 -> 1, translateY 16 -> 0, scale .98 -> 1 (550 ms easeOut).
export function Rise({ delay = 0, style, ...rest }: WrapperProps) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: Durations.rise, easing: Ease.easeOut }));
  }, [delay, p]);
  const animated = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: 16 * (1 - p.value) }, { scale: 0.98 + 0.02 * p.value }],
  }));
  return <Animated.View {...rest} style={[animated, style]} />;
}

// .scr: ekran içeriği opacity 0 -> 1, translateY 14 -> 0 (420 ms easeOut).
export function ScreenEnter({ style, ...rest }: WrapperProps) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: Durations.screenEnter, easing: Ease.easeOut });
  }, [p]);
  const animated = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: 14 * (1 - p.value) }],
  }));
  return <Animated.View {...rest} style={[{ flex: 1 }, animated, style]} />;
}

// .pop: scale .4 -> 1.1 (%60) -> 1, opacity 0 -> 1 (600 ms spring).
export function Pop({ delay = 0, style, ...rest }: WrapperProps) {
  const s = useSharedValue(0.4);
  const o = useSharedValue(0);
  useEffect(() => {
    s.value = withDelay(
      delay,
      withSequence(
        withTiming(1.1, { duration: Durations.pop * 0.6, easing: Ease.spring }),
        withTiming(1, { duration: Durations.pop * 0.4, easing: Ease.spring }),
      ),
    );
    o.value = withDelay(delay, withTiming(1, { duration: Durations.pop * 0.6 }));
  }, [delay, o, s]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return <Animated.View {...rest} style={[animated, style]} />;
}

// .floaty: 3.2 s'de 10 px yukarı-aşağı süzülür (dekoratif, sonsuz).
export function Floaty({ style, ...rest }: WrapperProps) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    y.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1600, easing: Ease.easeInOut }),
        withTiming(0, { duration: 1600, easing: Ease.easeInOut }),
      ),
      -1,
    );
    return () => cancelAnimation(y);
  }, [reduceMotion, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View {...rest} style={[animated, style]} />;
}

// .flash: yeni eklenen / geri alınan satırın çevresinde 3 px `brand`
// halka, 300 ms sonra 1.8 s'de söner. Ebeveyn relative, halka taşar.
export function FlashRing({ active, radius }: { active: boolean; radius: number }) {
  const o = useSharedValue(0);
  const color = useThemedStyle({ borderColor: 'brand' });
  useEffect(() => {
    if (!active) {
      return;
    }
    o.value = 1;
    o.value = withDelay(300, withTiming(0, { duration: Durations.flash, easing: Ease.ease }));
  }, [active, o]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: -3,
          left: -3,
          right: -3,
          bottom: -3,
          borderWidth: 3,
          borderRadius: radius + 3,
        },
        color,
        animated,
      ]}
    />
  );
}
