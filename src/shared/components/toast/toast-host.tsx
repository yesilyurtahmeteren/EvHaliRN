import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { Icon } from '@/shared/components/icon';
import { Ease, fixedColors } from '@/shared/theme';

import { useToastStore } from './toast-store';

// Kök layout'ta bir kez render edilir. Main.dc.html: gezinme çubuğunun 16 px
// üstünde, ortada hap; `toastBg` zemin, bal rengi daire içinde tik.
// Animasyon: ilk %10'da alttan (24 px, .96) girer, %86'dan sonra 12 px aşağı
// kayarak söner.
export function ToastHost() {
  const toast = useToastStore((s) => s.current);
  const bottomOffset = useToastStore((s) => s.bottomOffset);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();
  const p = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    if (toast === null) {
      return;
    }
    const enterMs = toast.durationMs * 0.1;
    const exitMs = toast.durationMs * 0.14;
    p.value = 0;
    exit.value = 0;
    p.value = withTiming(1, { duration: enterMs, easing: Ease.easeOut });
    exit.value = withSequence(
      withTiming(0, { duration: toast.durationMs - exitMs }),
      withTiming(1, { duration: exitMs, easing: Ease.easeOut }),
    );
    const timer = setTimeout(() => hide(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast, hide, p, exit]);

  const style = useAnimatedStyle(() => ({
    opacity: p.value * (1 - exit.value),
    transform: [
      { translateY: 24 * (1 - p.value) + 12 * exit.value },
      { scale: 0.96 + 0.04 * p.value },
    ],
  }));

  if (toast === null) {
    return null;
  }
  const isError = toast.kind === 'error';

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
        bottom: (bottomOffset > 0 ? bottomOffset : insets.bottom) + 16,
      }}
    >
      <Animated.View style={style}>
        <Box
          bg={isError ? 'dangerBg' : 'toastBg'}
          accessible
          accessibilityRole={isError ? 'alert' : undefined}
          accessibilityLiveRegion="polite"
          style={{
            maxWidth: 350,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 14,
            paddingLeft: 14,
            paddingRight: 20,
            borderRadius: 999,
            boxShadow: '0px 12px 30px -8px rgba(0,0,0,0.35)',
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isError ? fixedColors.badgeUnread : fixedColors.accentHoney,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name={isError ? 'warning' : 'check'}
              size={15}
              strokeWidth={3}
              color={isError ? fixedColors.onBtn : fixedColors.toastCheck}
            />
          </View>
          <AppText
            size={16}
            weight="bold"
            tone={isError ? 'dangerFg' : 'toastFg'}
            numberOfLines={isError ? 3 : 1}
            style={{ flexShrink: 1 }}
          >
            {toast.message}
          </AppText>
        </Box>
      </Animated.View>
    </View>
  );
}
