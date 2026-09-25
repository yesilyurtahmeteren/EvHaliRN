import { useNavigation } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useRequiredUser } from '@/features/auth/store';
import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { Card } from '@/shared/components/card';
import { Icon, type IconName } from '@/shared/components/icon';
import { Rise, ScreenEnter } from '@/shared/components/motion';
import { PressScale } from '@/shared/components/press-scale';
import { ErrorView, LoadingScreen } from '@/shared/components/states';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useFocusKey } from '@/shared/hooks/use-focus-key';
import { useMembers } from '@/shared/hooks/use-home';
import { reportError } from '@/shared/lib/feedback';
import type { HomeEvent } from '@/shared/schemas';
import {
  Durations,
  Ease,
  fixedColors,
  fontFamilies,
  memberColorsFor,
  sizes,
  type ColorToken,
} from '@/shared/theme';

import { markEventRead, markEventsRead, useHomeEvents } from '../events';
import { dayGroupOf, eventText, eventTime, type DayGroup } from '../lib/format-event';

// Bildirimler (HANDOFF §2.6): Geri, okunmamış varsa "Hepsini okudum",
// Bugün / Dün (/ Daha önce) grupları. Okunmamış kart 2 px `brand` kenarlıklı
// ve sağında turuncu nokta; dokununca okundu olur, nokta küçülerek kaybolur.
// Canlı konum ("markete girdi") bildirimi YOK.
export function NotificationsScreen() {
  const focusKey = useFocusKey();
  if (focusKey === 0) {
    return null;
  }
  return (
    <ScreenEnter key={focusKey}>
      <NotificationsContent />
    </ScreenEnter>
  );
}

const groupOrder: readonly DayGroup[] = ['today', 'yesterday', 'earlier'];

function NotificationsContent() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const homeId = useRequiredHomeId();
  const { uid } = useRequiredUser();
  const { events, unread, isPending, isError, refetch } = useHomeEvents(homeId);
  const members = useMembers(homeId).data;
  const names = useMemo(
    () => new Map((members ?? []).map((m) => [m.uid, m.displayName.trim().split(/\s+/)[0] ?? ''])),
    [members],
  );

  if (isPending) {
    return <LoadingScreen />;
  }
  if (isError) {
    return <ErrorView message={t('errors.generic')} onRetry={() => void refetch()} />;
  }

  const groups = groupOrder
    .map((key) => ({ key, items: events.filter((e) => dayGroupOf(e.createdAt) === key) }))
    .filter((g) => g.items.length > 0);
  const delays = new Map(events.map((e, i) => [e.id, 120 + i * 70]));

  const markAll = () =>
    void markEventsRead({ homeId, uid, eventIds: unread.map((e) => e.id) }).catch(reportError);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 12,
        paddingHorizontal: 20,
        paddingBottom: sizes.contentBottom,
      }}
    >
      <Rise style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <PressScale
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
          style={{
            height: 48,
            marginLeft: -8,
            paddingLeft: 6,
            paddingRight: 12,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="chevronLeft" size={24} strokeWidth={2.2} color="brand" />
          <AppText size={17} weight="bold" tone="brand">
            {t('common.back')}
          </AppText>
        </PressScale>
        <View style={{ flex: 1 }} />
        {unread.length > 0 && (
          <PressScale
            bg="mint"
            accessibilityRole="button"
            onPress={markAll}
            style={{
              height: 48,
              paddingHorizontal: 16,
              borderRadius: 999,
              justifyContent: 'center',
            }}
          >
            <AppText size={15} weight="bold" tone="mintFg">
              {t('notifications.markAllRead')}
            </AppText>
          </PressScale>
        )}
      </Rise>
      <Rise delay={200}>
        <AppText
          size={17}
          scaled
          tone="ink2"
          accessibilityLiveRegion="polite"
          style={{ marginTop: 8, marginHorizontal: 2 }}
        >
          {unread.length > 0
            ? t('notifications.summary', { count: unread.length })
            : t('notifications.allRead')}
        </AppText>
      </Rise>

      {events.length === 0 && (
        <Rise delay={280} style={{ marginTop: 22 }}>
          <Card style={{ padding: 20, borderRadius: 20 }}>
            <AppText size={16} scaled lineHeight={1.5} tone="ink2">
              {t('notifications.empty')}
            </AppText>
          </Card>
        </Rise>
      )}

      {groups.map((group) => (
        <View key={group.key}>
          <AppText
            size={17}
            weight="bold"
            scaled
            accessibilityRole="header"
            style={{ marginTop: 22, marginBottom: 10, marginHorizontal: 4 }}
          >
            {t(`notifications.${group.key}`)}
          </AppText>
          <View style={{ gap: 10 }}>
            {group.items.map((event) => {
              const delay = delays.get(event.id) ?? 120;
              return (
                <NoteCard
                  key={event.id}
                  event={event}
                  actorName={
                    event.actorId !== null
                      ? names.get(event.actorId) || t('notifications.someone')
                      : t('notifications.someone')
                  }
                  read={event.readBy.includes(uid)}
                  delay={delay}
                  onOpen={() =>
                    void markEventRead({ homeId, uid, eventId: event.id }).catch(reportError)
                  }
                />
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function iconFor(event: HomeEvent): { icon: IconName | null; bg: ColorToken; fg: ColorToken } {
  switch (event.type) {
    case 'bought':
      return { icon: 'bag', bg: 'mint', fg: 'mintFg' };
    case 'reminder':
      return { icon: 'clock', bg: 'honey', fg: 'honeyFg' };
    case 'weekly':
      return { icon: 'circleCheck', bg: 'hero', fg: 'brand' };
    default: {
      const [bg, fg] = memberColorsFor(event.actorId ?? '');
      return { icon: null, bg, fg };
    }
  }
}

function NoteCard({
  event,
  actorName,
  read,
  delay,
  onOpen,
}: {
  event: HomeEvent;
  actorName: string;
  read: boolean;
  delay: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const { who, text } = eventText(event, actorName, t);
  const look = iconFor(event);
  const dot = useSharedValue(read ? 0 : 1);
  useEffect(() => {
    dot.value = withTiming(read ? 0 : 1, { duration: Durations.dot, easing: Ease.spring });
  }, [dot, read]);
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dot.value,
    transform: [{ scale: dot.value }],
  }));
  const time = eventTime(event.createdAt, t);

  return (
    <Rise delay={delay}>
      <PressScale
        bg="card"
        border={read ? 'line' : 'brand'}
        pressedScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${who} ${text} ${time}${read ? '' : `, ${t('notifications.unreadLabel')}`}`}
        onPress={read ? undefined : onOpen}
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 14,
          padding: 16,
          borderWidth: 2,
          borderRadius: 20,
        }}
      >
        <Box
          bg={look.bg}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {look.icon === null ? (
            <AppText size={19} weight="extrabold" tone={look.fg}>
              {Array.from(actorName)[0]?.toLocaleUpperCase('tr') ?? '?'}
            </AppText>
          ) : (
            <Icon name={look.icon} size={22} color={look.fg} />
          )}
        </Box>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <AppText size={17} lineHeight={1.4} scaled>
            {/* İç metin rengini ve boyutunu dıştan devralır (animasyonlu stil
                iç içe metinde kullanılamaz). */}
            <Text style={{ fontFamily: fontFamilies.extrabold }}>{who}</Text>
            {` ${text}`}
          </AppText>
          <AppText size={14} scaled tone="ink2">
            {time}
          </AppText>
        </View>
        <Animated.View
          style={[
            {
              width: 12,
              height: 12,
              marginTop: 6,
              borderRadius: 6,
              backgroundColor: fixedColors.badgeUnread,
            },
            dotStyle,
          ]}
        />
      </PressScale>
    </Rise>
  );
}
