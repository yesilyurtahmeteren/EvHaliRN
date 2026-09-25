import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { useRequiredUser } from '@/features/auth/store';
import { AppText } from '@/shared/components/app-text';
import { Avatar } from '@/shared/components/avatar';
import { Box } from '@/shared/components/box';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Icon } from '@/shared/components/icon';
import { Pop, Rise, ScreenEnter } from '@/shared/components/motion';
import { showToast } from '@/shared/components/toast/toast-store';
import { Toggle } from '@/shared/components/toggle';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useFocusKey } from '@/shared/hooks/use-focus-key';
import { useHome } from '@/shared/hooks/use-home';
import { useUserDoc } from '@/shared/hooks/use-user-doc';
import { useWeekStats } from '@/shared/hooks/use-week-stats';
import { largeTextScale, roleOf, wantsAddedPush, wantsBoughtPush } from '@/shared/schemas';
import { Durations, Ease, fixedColors, sizes } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { useThemeStore } from '@/shared/theme/theme-store';

import {
  mustHandOver,
  useDeleteAccount,
  useLeaveHome,
  useSetNotificationPref,
  useSetTextScale,
} from '../hooks/use-profile-actions';

// Profilim (HANDOFF §2.5). Kamera ile fotoğraf değiştirme yok (Google
// fotoğrafı gösterilir); harcama istatistikleri bilinçli olarak yok.
export function ProfileScreen() {
  const focusKey = useFocusKey();
  if (focusKey === 0) {
    return null;
  }
  return (
    <ScreenEnter key={focusKey}>
      <ProfileContent />
    </ScreenEnter>
  );
}

function ProfileContent() {
  const { t } = useTranslation();
  const user = useRequiredUser();
  const homeId = useRequiredHomeId();
  const home = useHome(homeId).data ?? null;
  const { data: appUser } = useUserDoc();
  const signOut = useSignOut();
  const leaveHome = useLeaveHome();
  const deleteAccount = useDeleteAccount();
  const setPref = useSetNotificationPref();
  const setTextScale = useSetTextScale();
  const [confirming, setConfirming] = useState<'leave' | 'delete' | null>(null);

  const big = (appUser?.textScale ?? 1) > 1;
  const blockedByAdmin = home !== null && mustHandOver(home, user.uid);
  const askLeave = (kind: 'leave' | 'delete') => {
    if (blockedByAdmin) {
      showToast(t('profile.adminMustHandOver'), { kind: 'error' });
      return;
    }
    setConfirming(kind);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: sizes.contentBottom,
      }}
    >
      <Rise>
        <Card
          style={{
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: 20,
            borderRadius: 28,
            alignItems: 'center',
          }}
        >
          <Pop>
            <Avatar
              uid={user.uid}
              name={user.displayName ?? ''}
              photoUrl={user.photoURL}
              size={108}
              ring={{ width: 4, color: 'well' }}
            />
          </Pop>
          <AppText size={24} weight="extrabold" style={{ marginTop: 14, textAlign: 'center' }}>
            {user.displayName ?? ''}
          </AppText>
          <AppText size={16} tone="ink2" style={{ marginTop: 2, textAlign: 'center' }}>
            {user.email ?? ''}
          </AppText>
          {home !== null && (
            <Box
              bg="mint"
              style={{
                marginTop: 12,
                height: 34,
                paddingHorizontal: 16,
                borderRadius: 999,
                justifyContent: 'center',
              }}
            >
              <AppText size={15} weight="bold" tone="mintFg">
                {t(`roles.${roleOf(home, user.uid)}`)}
              </AppText>
            </Box>
          )}
          <Stats homeId={homeId} members={home?.memberIds.length ?? 1} />
        </Card>
      </Rise>

      <SectionTitle delay={200}>{t('profile.appearanceTitle')}</SectionTitle>
      <Rise delay={200}>
        <Card style={{ padding: 16, borderRadius: 24 }}>
          <ThemeSegment />
          <View
            style={{
              marginTop: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingTop: 4,
              paddingHorizontal: 2,
            }}
          >
            <Box
              bg="well"
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText size={20} weight="extrabold" tone="brand">
                Aa
              </AppText>
            </Box>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText size={17} weight="bold" scaled>
                {t('profile.bigText')}
              </AppText>
              <AppText size={14} scaled tone="ink2">
                {t('profile.bigTextSubtitle')}
              </AppText>
            </View>
            <Toggle
              value={big}
              onValueChange={(on) => void setTextScale.run(on ? largeTextScale : 1)}
              accessibilityLabel={t('profile.bigText')}
            />
          </View>
        </Card>
      </Rise>

      <SectionTitle delay={320}>{t('profile.notificationsTitle')}</SectionTitle>
      <Rise delay={320}>
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16, borderRadius: 24 }}>
          <PrefRow
            title={t('profile.notifyAdded')}
            text={t('profile.notifyAddedSubtitle')}
            value={appUser == null ? true : wantsAddedPush(appUser)}
            first
            onChange={(enabled) => void setPref.run({ pref: 'notifyAdded', enabled })}
          />
          <PrefRow
            title={t('profile.notifyBought')}
            text={t('profile.notifyBoughtSubtitle')}
            value={appUser == null ? true : wantsBoughtPush(appUser)}
            onChange={(enabled) => void setPref.run({ pref: 'notifyBought', enabled })}
          />
        </Card>
      </Rise>

      <SectionTitle delay={440}>{t('profile.accountTitle')}</SectionTitle>
      <Rise delay={440}>
        <Card style={{ padding: 16, borderRadius: 24, gap: 10 }}>
          <Button
            label={t('profile.manageMembers')}
            variant="well"
            icon="people"
            height={60}
            radius={16}
            fontSize={17}
            align="start"
            raised={false}
            trailing={<Icon name="chevronRight" size={20} color="ink2" strokeWidth={2.2} />}
            onPress={() => router.navigate('/home')}
          />
          <Button
            label={t('profile.signOut')}
            variant="well"
            icon="logout"
            height={60}
            radius={16}
            fontSize={17}
            align="start"
            raised={false}
            loading={signOut.isPending}
            onPress={() => void signOut.run()}
          />
          {home !== null && (
            <Button
              label={t('profile.leaveHome')}
              variant="well"
              icon="door"
              height={60}
              radius={16}
              fontSize={17}
              align="start"
              raised={false}
              loading={leaveHome.isPending}
              onPress={() => askLeave('leave')}
            />
          )}
          <Button
            label={t('profile.deleteAccount')}
            variant="danger"
            icon="warning"
            height={60}
            radius={16}
            fontSize={17}
            align="start"
            raised={false}
            loading={deleteAccount.isPending}
            onPress={() => askLeave('delete')}
          />
        </Card>
      </Rise>

      <Rise delay={580} style={{ marginTop: 20 }}>
        <AppText size={14} tone="ink2" style={{ textAlign: 'center' }}>
          {t('common.version', { version: Constants.expoConfig?.version ?? '' })}
        </AppText>
      </Rise>

      <ConfirmDialog
        visible={confirming === 'leave'}
        title={t('profile.leaveHomeConfirmTitle')}
        body={t('profile.leaveHomeConfirmBody')}
        confirmLabel={t('profile.leaveHome')}
        destructive
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          if (home !== null) {
            void leaveHome.run(home);
          }
        }}
      />
      <ConfirmDialog
        visible={confirming === 'delete'}
        title={t('profile.deleteConfirmTitle')}
        body={t('profile.deleteConfirmBody')}
        confirmLabel={t('profile.deleteConfirmButton')}
        destructive
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          void deleteAccount.run(home);
        }}
      />
    </ScrollView>
  );
}

function SectionTitle({ delay, children }: { delay: number; children: ReactNode }) {
  return (
    <Rise delay={delay} style={{ marginTop: 26, marginBottom: 10, marginHorizontal: 4 }}>
      <AppText size={18} weight="bold" scaled accessibilityRole="header">
        {children}
      </AppText>
    </Rise>
  );
}

// Ekran açılınca 0'dan sayar (900 ms, ease-out cubic).
function useCountUp(target: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / Durations.statsCount);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}

function Stats({ homeId, members }: { homeId: string; members: number }) {
  const { t } = useTranslation();
  const { bought, pending } = useWeekStats(homeId);
  const cells = [
    { value: useCountUp(members), label: t('profile.statMembers'), tone: 'brand' as const },
    { value: useCountUp(pending), label: t('profile.statPending'), tone: 'peachFg' as const },
    { value: useCountUp(bought), label: t('profile.statWeek'), tone: 'honeyFg' as const },
  ];
  return (
    <Box
      bg="soft"
      style={{
        marginTop: 18,
        alignSelf: 'stretch',
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 20,
      }}
    >
      {cells.map((cell) => (
        <View key={cell.label} accessible style={{ flex: 1, alignItems: 'center' }}>
          <AppText size={26} weight="extrabold" tone={cell.tone}>
            {String(cell.value)}
          </AppText>
          <AppText size={14} tone="ink2">
            {cell.label}
          </AppText>
        </View>
      ))}
    </Box>
  );
}

// Aydınlık / Koyu: beyaz gösterge 550 ms softSpring ile kayar; güneş -90°,
// ay 60° -> 0° döner (800 ms).
function ThemeSegment() {
  const { t } = useTranslation();
  const { scheme, colors } = useAppTheme();
  const setMode = useThemeStore((s) => s.setMode);
  const isDark = scheme === 'dark';
  const [width, setWidth] = useState(0);
  const x = useSharedValue(isDark ? 1 : 0);
  const rot = useSharedValue(isDark ? 1 : 0);
  useEffect(() => {
    x.value = withTiming(isDark ? 1 : 0, { duration: Durations.segment, easing: Ease.softSpring });
    rot.value = withTiming(isDark ? 1 : 0, { duration: Durations.theme, easing: Ease.softSpring });
  }, [isDark, rot, x]);
  const indicator = useAnimatedStyle(() => ({
    width: (width - 10) / 2,
    transform: [{ translateX: x.value * ((width - 10) / 2) }],
  }));
  const sun = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value * -90}deg` }] }));
  const moon = useAnimatedStyle(() => ({ transform: [{ rotate: `${60 - rot.value * 60}deg` }] }));

  const option = (dark: boolean, label: string, icon: ReactNode) => (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isDark === dark }}
      accessibilityLabel={label}
      onPress={() => setMode(dark ? 'dark' : 'light')}
      style={{
        flex: 1,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      {icon}
      <AppText size={17} weight="bold">
        {label}
      </AppText>
    </Pressable>
  );

  return (
    <Box
      bg="well"
      accessibilityRole="radiogroup"
      accessibilityLabel={t('profile.themeLabel')}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', padding: 5, borderRadius: 20 }}
    >
      <Animated.View style={[{ position: 'absolute', top: 5, left: 5, bottom: 5 }, indicator]}>
        <Box
          bg="card"
          style={{ flex: 1, borderRadius: 16, boxShadow: `0px 4px 14px -4px ${colors.shadow}` }}
        />
      </Animated.View>
      {option(
        false,
        t('profile.light'),
        <Animated.View style={sun}>
          <Icon name="sun" size={24} strokeWidth={2} color={fixedColors.sun} />
        </Animated.View>,
      )}
      {option(
        true,
        t('profile.dark'),
        <Animated.View style={moon}>
          <Icon name="moon" size={24} strokeWidth={2} color="brand" />
        </Animated.View>,
      )}
    </Box>
  );
}

function PrefRow({
  title,
  text,
  value,
  first = false,
  onChange,
}: {
  title: string;
  text: string;
  value: boolean;
  first?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Box
      border={first ? 'transparent' : 'line'}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 14,
        borderTopWidth: 1,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText size={17} weight="bold" scaled>
          {title}
        </AppText>
        <AppText size={14} lineHeight={1.4} scaled tone="ink2">
          {text}
        </AppText>
      </View>
      <Toggle value={value} onValueChange={onChange} accessibilityLabel={title} />
    </Box>
  );
}
