import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/shared/components/app-text';
import { spacing } from '@/shared/theme';

import { useToastStore } from './toast-store';

// Kök layout'ta bir kez render edilir. Sekme çubuğu varken onun üstünde
// çıkar (toast-store bottomOffset); yoksa alt güvenli alanın üstünde.
export function ToastHost() {
  const toast = useToastStore((s) => s.current);
  const bottomOffset = useToastStore((s) => s.bottomOffset);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (toast === null) {
      return;
    }
    const timer = setTimeout(() => hide(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [toast, hide]);

  if (toast === null) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: spacing.md,
        right: spacing.md,
        bottom: (bottomOffset > 0 ? bottomOffset : insets.bottom) + spacing.md,
      }}
    >
      <Animated.View
        key={toast.id}
        entering={FadeInDown}
        exiting={FadeOutDown}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        className="min-h-touch flex-row items-center gap-sm rounded-sm bg-inverse-surface py-sm pl-md pr-sm"
      >
        <AppText variant="body-md" tone="on-inverse-surface" className="flex-1">
          {toast.message}
        </AppText>
        {toast.action !== undefined && (
          <Pressable
            accessibilityRole="button"
            hitSlop={spacing.xs}
            onPress={() => {
              toast.action?.onPress();
              hide(toast.id);
            }}
            className="min-h-touch justify-center rounded-full px-sm active:opacity-70"
          >
            <AppText variant="label-lg" tone="inverse-primary">
              {toast.action.label}
            </AppText>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}
