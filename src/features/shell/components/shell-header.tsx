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

import { useSessionStore } from '@/features/auth/store';
import { AppIconMark } from '@/shared/components/app-icon-mark';
import { AppText } from '@/shared/components/app-text';
import { Avatar } from '@/shared/components/avatar';
import { Box } from '@/shared/components/box';
import { Icon } from '@/shared/components/icon';
import { Pop } from '@/shared/components/motion';
import { PressScale } from '@/shared/components/press-scale';
import { Durations, Ease, fixedColors, sizes } from '@/shared/theme';

// Main.dc.html başlığı (68 px): solda 38 px logo + ekran başlığı (20/800,
// ekran değişince .pop), sağda çan (48 px, okunmamış rozeti) ve profil
// fotoğrafı (40 px, 48 px dokunma alanı).
export function ShellHeader({
  title,
  unreadCount,
  onNotifications,
  notificationsOpen,
  onProfile,
}: {
  title: string;
  unreadCount: number;
  onNotifications: () => void;
  notificationsOpen: boolean;
  onProfile: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useSessionStore((s) => s.user ?? s.lastUser);

  return (
    <Box bg="header" border="line" style={{ paddingTop: insets.top, borderBottomWidth: 1 }}>
      <View
        style={{
          height: sizes.headerHeight,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 20,
          paddingRight: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
          <AppIconMark size={38} radius={11} />
          <Pop key={title} style={{ flexShrink: 1 }}>
            <AppText
              size={20}
              weight="extrabold"
              tracking={-0.02}
              numberOfLines={1}
              accessibilityRole="header"
            >
              {title}
            </AppText>
          </Pop>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <PressScale
            bg={notificationsOpen ? 'mint' : 'transparent'}
            accessibilityRole="button"
            accessibilityLabel={
              unreadCount > 0 ? t('shell.bellUnread', { count: unreadCount }) : t('shell.bell')
            }
            accessibilityState={{ selected: notificationsOpen }}
            onPress={onNotifications}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RingingBell ringing={unreadCount > 0} />
            {unreadCount > 0 && (
              <Pop key={unreadCount} style={{ position: 'absolute', top: 4, right: 3 }}>
                <Box
                  border="bg"
                  style={{
                    minWidth: 21,
                    height: 21,
                    paddingHorizontal: 5,
                    borderRadius: 999,
                    borderWidth: 2,
                    backgroundColor: fixedColors.badgeUnread,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText size={12} weight="extrabold" tone={fixedColors.onBtn} lineHeight={14}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </AppText>
                </Box>
              </Pop>
            )}
          </PressScale>
          <PressScale
            accessibilityRole="button"
            accessibilityLabel={t('shell.profile')}
            onPress={onProfile}
            style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Avatar
              uid={user?.uid ?? ''}
              name={user?.displayName ?? ''}
              photoUrl={user?.photoURL ?? null}
              size={40}
              ring={{ width: 2, color: 'card' }}
            />
          </PressScale>
        </View>
      </View>
    </Box>
  );
}

// @keyframes bellRing (3.2 s, .6 s gecikme, sonsuz): kısa bir sallanma,
// sonra %55'ten itibaren durur. Dönme noktası çanın tepesi (50% 12%).
const ringSteps: readonly [number, number][] = [
  [0.05, 16],
  [0.12, -14],
  [0.19, 10],
  [0.26, -8],
  [0.33, 4],
  [0.4, -2],
  [0.55, 0],
  [1, 0],
];

function RingingBell({ ringing }: { ringing: boolean }) {
  const reduceMotion = useReducedMotion();
  const angle = useSharedValue(0);

  useEffect(() => {
    if (!ringing || reduceMotion) {
      cancelAnimation(angle);
      angle.value = withTiming(0, { duration: 150 });
      return;
    }
    let previous = 0;
    const steps = ringSteps.map(([at, deg]) => {
      const duration = (at - previous) * Durations.bellRing;
      previous = at;
      return withTiming(deg, { duration, easing: Ease.easeInOut });
    });
    angle.value = withDelay(600, withRepeat(withSequence(...steps), -1));
    return () => cancelAnimation(angle);
  }, [angle, reduceMotion, ringing]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  return (
    <Animated.View style={[{ transformOrigin: '50% 12%' }, style]}>
      <Icon name="bell" size={26} color="ink" />
    </Animated.View>
  );
}
