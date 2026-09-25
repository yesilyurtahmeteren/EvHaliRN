import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useRequiredUser } from '@/features/auth/store';
import { useShellUi } from '@/features/shell/ui-store';
import { AppText } from '@/shared/components/app-text';
import { Avatar } from '@/shared/components/avatar';
import { Box } from '@/shared/components/box';
import { Button } from '@/shared/components/button';
import { Card, useShadow } from '@/shared/components/card';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Icon } from '@/shared/components/icon';
import { Floaty, Pop, Rise, ScreenEnter } from '@/shared/components/motion';
import { PressScale } from '@/shared/components/press-scale';
import { ErrorView, LoadingScreen } from '@/shared/components/states';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useFocusKey } from '@/shared/hooks/use-focus-key';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useWeekStats } from '@/shared/hooks/use-week-stats';
import { formatInviteCode } from '@/shared/lib/invite-code';
import { possessiveSuffix } from '@/shared/lib/turkish';
import { roleOf, type Home } from '@/shared/schemas';
import { Durations, Ease, fixedColors, sizes } from '@/shared/theme';
import { useThemedSvgProps } from '@/shared/theme/use-theme-color';

import {
  useInviteCodeSharing,
  useRegenerateInviteCode,
  useRenameHome,
} from '../hooks/use-dashboard-actions';
import { RenameHomeDialog } from './rename-home-dialog';

// Evim (HANDOFF §2.4): karşılama kartı, haftalık özet halkası, aileyi davet
// et (kod + Kopyala / Gönder), aile bireyleri, sesle ekleme ipucu. Ev adını
// değiştirmek, kodu yenilemek ve rolleri düzenlemek yalnızca yöneticide.
export function HomeDashboardScreen() {
  const { t } = useTranslation();
  const homeId = useRequiredHomeId();
  const home = useHome(homeId);
  const focusKey = useFocusKey();

  if (home.isPending) {
    return <LoadingScreen />;
  }
  if (home.isError || home.data === null) {
    return <ErrorView message={t('errors.generic')} onRetry={() => void home.refetch()} />;
  }
  if (focusKey === 0) {
    return null;
  }
  return (
    <ScreenEnter key={focusKey}>
      <DashboardContent home={home.data} />
    </ScreenEnter>
  );
}

function DashboardContent({ home }: { home: Home }) {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  const isAdmin = roleOf(home, uid) === 'admin';
  const [renaming, setRenaming] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const rename = useRenameHome(home.id);
  const regenerate = useRegenerateInviteCode(home.id);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: sizes.contentBottom,
      }}
    >
      <Rise>
        <Box bg="hero" style={{ padding: 22, borderRadius: 28, overflow: 'hidden' }}>
          <Floaty style={{ position: 'absolute', right: -30, top: -30 }}>
            <Box bg="mint" style={{ width: 130, height: 130, borderRadius: 65 }} />
          </Floaty>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppText size={15} weight="bold" tone="mintFg">
                {t('dashboard.greeting')}
              </AppText>
              <AppText
                size={28}
                lineHeight={34}
                weight="extrabold"
                tracking={-0.02}
                accessibilityRole="header"
                style={{ marginVertical: 6 }}
              >
                {home.name}
              </AppText>
              <AppText size={16} scaled tone="ink2">
                {t('dashboard.sharing', { count: home.memberIds.length })}
              </AppText>
            </View>
            {isAdmin && (
              <PressScale
                bg="card"
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.editHomeName')}
                onPress={() => setRenaming(true)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="pencil" size={22} color="brand" />
              </PressScale>
            )}
          </View>
        </Box>
      </Rise>

      <WeekCard homeId={home.id} />

      <Rise delay={320} style={{ marginTop: 14 }}>
        <Card style={{ padding: 20, borderRadius: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="personAdd" size={22} color="brand" />
            <AppText size={19} weight="bold" scaled accessibilityRole="header">
              {t('dashboard.inviteTitle')}
            </AppText>
          </View>
          <AppText
            size={16}
            lineHeight={1.5}
            scaled
            tone="ink2"
            style={{ marginTop: 8, marginBottom: 14 }}
          >
            {t('dashboard.inviteBody')}
          </AppText>
          <InviteCode code={home.inviteCode} />
          {isAdmin && (
            <View style={{ marginTop: 10 }}>
              <Button
                label={t('dashboard.regenerate')}
                variant="well"
                icon="refresh"
                height={48}
                radius={16}
                fontSize={15}
                raised={false}
                loading={regenerate.isPending}
                onPress={() => setConfirmingRegenerate(true)}
              />
            </View>
          )}
        </Card>
      </Rise>

      <Members home={home} isAdmin={isAdmin} />

      <Rise delay={860} style={{ marginTop: 16 }}>
        <Box bg="tip" style={{ flexDirection: 'row', gap: 14, padding: 18, borderRadius: 24 }}>
          <Box
            bg="peach"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="mic" size={24} color="peachFg" />
          </Box>
          <View style={{ flex: 1 }}>
            <AppText size={17} weight="bold" scaled>
              {t('dashboard.tipTitle')}
            </AppText>
            <AppText size={15} lineHeight={1.5} scaled tone="ink2" style={{ marginTop: 4 }}>
              {t('dashboard.tipBody')}
            </AppText>
          </View>
        </Box>
      </Rise>

      {renaming && (
        <RenameHomeDialog
          currentName={home.name}
          onCancel={() => setRenaming(false)}
          onSave={(name) => {
            setRenaming(false);
            void rename.run(name);
          }}
        />
      )}
      <ConfirmDialog
        visible={confirmingRegenerate}
        title={t('dashboard.regenerateConfirmTitle')}
        body={t('dashboard.regenerateConfirmBody')}
        onCancel={() => setConfirmingRegenerate(false)}
        onConfirm={() => {
          setConfirmingRegenerate(false);
          void regenerate.run(home.inviteCode);
        }}
      />
    </ScrollView>
  );
}

const ringLength = 150.8; // 2πr, r = 24 (viewBox 60)
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// 64 px halka (`accentHoney`), açılışta 1.4 s'de dolar.
function WeekCard({ homeId }: { homeId: string }) {
  const { t } = useTranslation();
  const { bought, percent } = useWeekStats(homeId);
  const offset = useSharedValue(ringLength);
  useEffect(() => {
    offset.value = withDelay(
      300,
      withTiming(ringLength * (1 - percent / 100), {
        duration: Durations.ring,
        easing: Ease.easeOut,
      }),
    );
  }, [offset, percent]);
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  const trackProps = useThemedSvgProps('well');

  return (
    <Rise delay={200} style={{ marginTop: 14 }}>
      <Card
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          padding: 18,
          borderRadius: 28,
        }}
      >
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('dashboard.weekRingLabel', { percent })}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
          style={{ width: 64, height: 64 }}
        >
          <Svg width={64} height={64} viewBox="0 0 60 60">
            <AnimatedCircle
              cx={30}
              cy={30}
              r={24}
              fill="none"
              strokeWidth={7}
              animatedProps={trackProps}
            />
            <AnimatedCircle
              cx={30}
              cy={30}
              r={24}
              fill="none"
              stroke={fixedColors.accentHoney}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={ringLength}
              transform="rotate(-90 30 30)"
              animatedProps={ringProps}
            />
          </Svg>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText size={15} weight="extrabold">{`%${percent}`}</AppText>
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText size={14} weight="bold" tone="peachFg">
            {t('dashboard.weekTitle')}
          </AppText>
          <AppText size={18} weight="bold" scaled style={{ marginTop: 2 }}>
            {t('dashboard.weekBought', { count: bought })}
          </AppText>
          <AppText size={15} scaled tone="ink2" style={{ marginTop: 2 }}>
            {t('dashboard.weekPercent', { percent, suffix: possessiveSuffix(percent) })}
          </AppText>
        </View>
      </Card>
    </Rise>
  );
}

// Kod kutusu + Kopyala (1.8 s "Kopyalandı", `mint` zemin) ve Gönder.
function InviteCode({ code }: { code: string }) {
  const { t } = useTranslation();
  const { share, copy } = useInviteCodeSharing();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), Durations.copied);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <Box bg="well" style={{ padding: 16, borderRadius: 20, alignItems: 'center' }}>
        <AppText size={14} weight="semibold" tone="ink2">
          {t('dashboard.codeLabel')}
        </AppText>
        <AppText
          selectable
          size={28}
          accessibilityLabel={code.split('').join(' ')}
          style={{
            marginTop: 4,
            fontFamily: 'monospace',
            fontWeight: '800',
            letterSpacing: 28 * 0.08,
          }}
        >
          {formatInviteCode(code)}
        </AppText>
      </Box>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
        <PressScale
          bg={copied ? 'mint' : 'card'}
          border="line"
          accessibilityRole="button"
          accessibilityLabel={copied ? t('dashboard.copied') : t('dashboard.copy')}
          onPress={() => {
            void copy(code).then(() => setCopied(true));
          }}
          style={{
            flex: 1,
            height: 56,
            borderWidth: 2,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {copied ? (
            <Pop key="copied">
              <Icon name="check" size={20} strokeWidth={2.6} color="mintFg" />
            </Pop>
          ) : (
            <Icon name="copy" size={20} color="ink" />
          )}
          <AppText
            size={17}
            weight="bold"
            tone={copied ? 'mintFg' : 'ink'}
            accessibilityLiveRegion="polite"
          >
            {copied ? t('dashboard.copied') : t('dashboard.copy')}
          </AppText>
        </PressScale>
        <Button
          label={t('dashboard.send')}
          icon="share"
          height={56}
          radius={16}
          fontSize={17}
          raised={false}
          flex
          onPress={() => void share(code)}
        />
      </View>
    </>
  );
}

// Canlı durum/konum göstergesi YOK (HANDOFF §2.4). Yönetici bir üyeye
// dokununca rol sayfası açılır.
function Members({ home, isAdmin }: { home: Home; isAdmin: boolean }) {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  const members = useMembers(home.id).data ?? [];
  const openMemberSheet = useShellUi((s) => s.openMemberSheet);
  const rowShadow = useShadow('row');

  return (
    <>
      <Rise
        delay={440}
        style={{
          marginTop: 26,
          marginBottom: 12,
          marginHorizontal: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <AppText size={20} weight="bold" scaled accessibilityRole="header">
          {t('dashboard.membersTitle')}
        </AppText>
        <Box
          bg="well"
          style={{ height: 28, paddingHorizontal: 10, borderRadius: 999, justifyContent: 'center' }}
        >
          <AppText size={14} weight="bold">
            {t('dashboard.memberCount', { count: members.length })}
          </AppText>
        </Box>
      </Rise>
      <View style={{ gap: 10 }}>
        {members.map((member, index) => {
          const content = (
            <>
              <Avatar
                uid={member.uid}
                name={member.displayName}
                photoUrl={member.photoUrl}
                size={52}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}
                >
                  <AppText size={18} weight="bold" scaled>
                    {member.displayName}
                  </AppText>
                  {member.uid === uid && (
                    <AppText size={14} tone="ink2">
                      {t('dashboard.you')}
                    </AppText>
                  )}
                </View>
                <AppText size={15} scaled tone="ink2" style={{ marginTop: 2 }}>
                  {t(`roles.${roleOf(home, member.uid)}`)}
                </AppText>
              </View>
              {isAdmin && <Icon name="chevronRight" size={20} color="ink2" strokeWidth={2.2} />}
            </>
          );
          const rowStyle = {
            minHeight: 76,
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            gap: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 20,
          };
          return (
            <Rise key={member.uid} delay={200 + index * 90}>
              {isAdmin ? (
                <PressScale
                  bg="card"
                  accessibilityRole="button"
                  accessibilityHint={t('dashboard.manageHint')}
                  onPress={() => openMemberSheet(member.uid)}
                  style={[rowStyle, { boxShadow: rowShadow }]}
                >
                  {content}
                </PressScale>
              ) : (
                <Card shadow="row" style={rowStyle}>
                  {content}
                </Card>
              )}
            </Rise>
          );
        })}
      </View>
    </>
  );
}
