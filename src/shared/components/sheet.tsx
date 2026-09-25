import { BlurView } from 'expo-blur';
import { useEffect, type ReactNode, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Durations, Ease } from '@/shared/theme';

import { Box } from './box';
import { useShadow } from './card';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// Main.dc.html alt sayfası: scrim 300 ms'de belirir (+ 5 px bulanıklık),
// sayfa alttan 500 ms easeOut ile kayar; kapanışta 260 ms easeIn ile iner ve
// ancak animasyon bitince onClosed çağrılır. Üst köşeler 32, tutma çubuğu
// 48x5 `reed`. Scrim'e dokunmak ya da geri tuşu kapatır (closing=true isteği
// üst bileşene onRequestClose ile gider).
export function Sheet({
  closing,
  onRequestClose,
  onClosed,
  blurTarget,
  accessibilityLabel,
  children,
}: {
  closing: boolean;
  onRequestClose: () => void;
  onClosed: () => void;
  blurTarget?: RefObject<View | null>;
  accessibilityLabel: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const shadow = useShadow('card');
  const scrim = useSharedValue(0);
  // 0 = aşağıda (gizli), 1 = açık.
  const slide = useSharedValue(0);

  useEffect(() => {
    if (closing) {
      scrim.value = withTiming(0, { duration: Durations.sheetClose, easing: Ease.ease });
      slide.value = withTiming(
        0,
        { duration: Durations.sheetClose, easing: Ease.easeIn },
        (finished) => {
          if (finished === true) {
            scheduleOnRN(onClosed);
          }
        },
      );
    } else {
      scrim.value = withTiming(1, { duration: Durations.scrimFade, easing: Ease.ease });
      slide.value = withTiming(1, { duration: Durations.sheetOpen, easing: Ease.easeOut });
    }
  }, [closing, onClosed, scrim, slide]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose();
      return true;
    });
    return () => sub.remove();
  }, [onRequestClose]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: `${(1 - slide.value) * 100}%` }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]}>
        <AnimatedBlurView
          intensity={20}
          blurReductionFactor={4}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          style={StyleSheet.absoluteFill}
        />
        <Box bg="scrim" style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        accessibilityLabel={accessibilityLabel}
        style={[
          { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '94%' },
          sheetStyle,
        ]}
      >
        <Box
          bg="bg"
          style={{
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: 22 + insets.bottom,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            boxShadow: shadow.replace('0px 6px 24px -6px', '0px -12px 40px -8px'),
          }}
        >
          <Box
            bg="reed"
            style={{
              width: 48,
              height: 5,
              borderRadius: 999,
              alignSelf: 'center',
              marginBottom: 12,
            }}
          />
          {children}
        </Box>
      </Animated.View>
    </View>
  );
}
