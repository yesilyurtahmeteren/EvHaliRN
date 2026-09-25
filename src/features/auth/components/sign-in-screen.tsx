import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconMark } from '@/shared/components/app-icon-mark';
import { AppText } from '@/shared/components/app-text';
import { Icon, GoogleLogo } from '@/shared/components/icon';
import { Rise } from '@/shared/components/motion';
import { PressScale } from '@/shared/components/press-scale';
import { Spinner } from '@/shared/components/spinner';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { Ease } from '@/shared/theme';

import { useSignIn } from '../hooks/use-auth-actions';

// Giriş (HANDOFF §2.1): dikey ortalanmış logo (156 px, dönerek büyür, sonra
// hafifçe sallanır), "Ev Hali", alt yazı; en altta Google düğmesi ve güven
// ibaresi. Yükleme sırasında düğmeye tekrar basılamaz. Başarılı girişte
// yönlendirme yok: korumalı rotalar oturum değişince kendiliğinden geçer.
export function SignInScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const signIn = useSignIn();
  const busy = signIn.isPending;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        paddingTop: 32 + insets.top,
        paddingBottom: 34 + insets.bottom,
        paddingHorizontal: 24,
      }}
    >
      <View style={{ flexGrow: 1 }} />
      <AnimatedLogo />
      <Rise delay={200}>
        <AppText
          size={46}
          lineHeight={52}
          weight="extrabold"
          tracking={-0.03}
          tone="brand"
          accessibilityRole="header"
          style={{ marginTop: 30, textAlign: 'center' }}
        >
          {t('common.appName')}
        </AppText>
      </Rise>
      <Rise delay={320}>
        <AppText
          size={19}
          lineHeight={28}
          tone="ink2"
          style={{ marginTop: 10, maxWidth: 310, textAlign: 'center' }}
        >
          {t('auth.subtitle')}
        </AppText>
      </Rise>
      <View style={{ flexGrow: 1 }} />

      <Rise delay={720} style={{ alignSelf: 'stretch' }}>
        <PressScale
          bg="card"
          border="line"
          accessibilityRole="button"
          accessibilityLabel={busy ? t('auth.signingIn') : t('auth.signInWithGoogle')}
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          onPress={() => void signIn.run()}
          style={{
            height: 64,
            borderWidth: 2,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            boxShadow: `0px 12px 32px -6px ${colors.shadow}`,
          }}
        >
          {busy ? <Spinner /> : <GoogleLogo />}
          <AppText size={19} weight="bold">
            {busy ? t('auth.signingIn') : t('auth.signInWithGoogle')}
          </AppText>
        </PressScale>
      </Rise>
      <Rise
        delay={860}
        style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        <Icon name="shield" size={20} color="brand" />
        <AppText size={15} weight="medium" tone="ink2">
          {t('auth.trustCaption')}
        </AppText>
      </Rise>
    </View>
  );
}

// @keyframes logoIn (900 ms spring, 100 ms gecikme) + .sway (±3°, 4 s,
// 1.1 s gecikme, sonsuz, dönme noktası 50% 20%).
function AnimatedLogo() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const p = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      100,
      withSequence(
        withTiming(0.6, { duration: 540, easing: Ease.spring }),
        withTiming(1, { duration: 360, easing: Ease.spring }),
      ),
    );
    if (reduceMotion) {
      return;
    }
    sway.value = withDelay(
      1100,
      withSequence(
        withTiming(-3, { duration: 1000, easing: Ease.easeInOut }),
        withRepeat(
          withSequence(
            withTiming(3, { duration: 2000, easing: Ease.easeInOut }),
            withTiming(-3, { duration: 2000, easing: Ease.easeInOut }),
          ),
          -1,
        ),
      ),
    );
    return () => cancelAnimation(sway);
  }, [p, reduceMotion, sway]);

  // p: 0 -> 0.6 (keyframe %60) -> 1; ara değerler parça parça doğrusal.
  const inStyle = useAnimatedStyle(() => {
    const v = p.value;
    const a = Math.min(v / 0.6, 1);
    const b = Math.max((v - 0.6) / 0.4, 0);
    const y = v <= 0.6 ? 24 + (-4 - 24) * a : -4 + 4 * b;
    const scale = v <= 0.6 ? 0.6 + (1.06 - 0.6) * a : 1.06 - 0.06 * b;
    const rotate = v <= 0.6 ? -8 + 10 * a : 2 - 2 * b;
    return {
      opacity: a,
      transform: [{ translateY: y }, { scale }, { rotate: `${rotate}deg` }],
    };
  });
  const swayStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value}deg` }] }));

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('auth.logoLabel')}
      style={[
        {
          width: 156,
          height: 156,
          borderRadius: 42,
          boxShadow: `0px 24px 48px -12px rgba(29,90,63,0.4), 0px 6px 14px -4px rgba(29,90,63,0.2)`,
        },
        inStyle,
      ]}
    >
      <Animated.View style={[{ transformOrigin: '50% 20%' }, swayStyle]}>
        <AppIconMark size={156} radius={42} />
      </Animated.View>
    </Animated.View>
  );
}
