import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useShellUi } from '@/features/shell/ui-store';
import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { Card } from '@/shared/components/card';
import { Rise } from '@/shared/components/motion';
import { bumpSequence, Durations, Ease } from '@/shared/theme';

// Main.dc.html ilerleme kartı: büyük bekleyen sayısı (bump), "3 / 8 alındı",
// 16 px ilerleme çubuğu (açılışta 1.3 s'de dolar, sonra her değişimde 900 ms
// yaylanır, üstünden 2.8 s'de bir parıltı geçer) ve yönlendirme metni.
export function ProgressCard({ pending, bought }: { pending: number; bought: number }) {
  const { t } = useTranslation();
  const total = pending + bought;
  const pct = total === 0 ? 0 : Math.round((bought / total) * 100);

  return (
    <Rise>
      <Card style={{ padding: 20, borderRadius: 28 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexShrink: 1 }}>
            <BumpingCount value={pending} />
            <AppText size={18} weight="bold" scaled style={{ flexShrink: 1 }}>
              {t('list.pendingLabel')}
            </AppText>
          </View>
          <AppText size={15} weight="semibold" tone="ink2" scaled numberOfLines={1}>
            {t('list.progress', { bought, total })}
          </AppText>
        </View>
        <ProgressBar pct={pct} />
        <AppText size={15} tone="ink2" scaled style={{ marginTop: 10 }}>
          {pending === 0 ? t('list.hintDone') : t('list.hint')}
        </AppText>
      </Card>
    </Rise>
  );
}

// Sayı değişince (ya da bir ekleme/alma "bump" isteyince) 1 -> 1.28 -> 1.
function BumpingCount({ value }: { value: number }) {
  const bumpKey = useShellUi((s) => s.bumpKey);
  const scale = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scale.value = bumpSequence();
  }, [bumpKey, value, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <AppText size={44} lineHeight={48} weight="extrabold" tracking={-0.03} tone="brand">
        {String(value)}
      </AppText>
    </Animated.View>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useSharedValue(0);
  const mounted = useRef(false);
  const shine = useSharedValue(-1.2);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      fill.value = withDelay(
        Durations.progressGrowDelay,
        withTiming(pct, { duration: Durations.progressGrow, easing: Ease.easeOut }),
      );
      return;
    }
    fill.value = withTiming(pct, { duration: Durations.progressFill, easing: Ease.fill });
  }, [fill, pct]);

  // .shine: 2.8 s'lik döngünün ilk %60'ında soldan sağa geçer, 1.4 s gecikme.
  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    shine.value = withDelay(
      1400,
      withRepeat(
        withSequence(
          withTiming(3.2, { duration: 2800 * 0.6, easing: Ease.easeInOut }),
          withTiming(3.2, { duration: 2800 * 0.4 }),
          withTiming(-1.2, { duration: 0 }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(shine);
  }, [reduceMotion, shine]);

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(16, (trackWidth * fill.value) / 100),
  }));
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shine.value * Math.max(16, (trackWidth * fill.value) / 100) * 0.4 }],
  }));

  return (
    <Box
      bg="well"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('list.progressLabel')}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      style={{ marginTop: 16, height: 16, borderRadius: 999, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height: 16, borderRadius: 999, overflow: 'hidden' }, fillStyle]}>
        <Box bg="btn" style={{ flex: 1 }} />
        <Animated.View
          style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%' }, shineStyle]}
        >
          <Svg width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#ffffff" stopOpacity={0} />
                <Stop offset="0.5" stopColor="#ffffff" stopOpacity={0.35} />
                <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#shine)" />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Box>
  );
}
