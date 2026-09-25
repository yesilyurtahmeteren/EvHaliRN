import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { useRequiredUser } from '@/features/auth/store';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { LoadingBar } from '@/shared/components/loading-bar';
import { MemberAvatar } from '@/shared/components/member-avatar';
import { ErrorView, LoadingScreen } from '@/shared/components/states';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import { formatInviteCode } from '@/shared/lib/invite-code';
import { useAppTheme } from '@/shared/theme/theme-provider';

import {
  useInviteCodeSharing,
  useRegenerateInviteCode,
  useRenameHome,
} from '../hooks/use-dashboard-actions';
import { RenameHomeDialog } from './rename-home-dialog';

// Flutter screens/home_dashboard_screen.dart (Figma "Ev"): karşılama kartı
// (ev adı + düzenle), durum kartı (GERÇEK bekleyen/tamamlanan sayıları),
// davet kodu (paylaş / kopyala / yenile), aile bireyleri. Rol, "şu an
// markette" gibi veri modelinde karşılığı olmayan Figma alanları Flutter'da
// da bilerek yok.
export function HomeDashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const homeId = useRequiredHomeId();
  const home = useHome(homeId);
  const [renaming, setRenaming] = useState(false);
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const rename = useRenameHome(homeId);
  const regenerate = useRegenerateInviteCode(homeId);
  const { share, copy } = useInviteCodeSharing();

  if (home.isPending) {
    return <LoadingScreen />;
  }
  if (home.isError || home.data === null) {
    return <ErrorView message={t('errors.generic')} onRetry={() => void home.refetch()} />;
  }
  const { name, inviteCode } = home.data;

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-md p-lg pb-xxl">
      <Card className="flex-row items-start gap-md">
        <View className="flex-1 gap-xs">
          <AppText variant="label-lg" tone="primary">
            {t('dashboard.greeting')}
          </AppText>
          <AppText variant="headline-lg" accessibilityRole="header">
            {name}
          </AppText>
          <AppText variant="body-md" tone="on-surface-variant">
            {t('dashboard.subtitle')}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.editHomeName')}
          onPress={() => setRenaming(true)}
          className="h-touch w-touch items-center justify-center rounded-full bg-secondary-container active:opacity-80"
        >
          <MaterialIcons name="edit" size={22} color={colors['on-secondary-container']} />
        </Pressable>
      </Card>

      <StatusCard homeId={homeId} />

      <Card style={{ backgroundColor: colors['invite-code-bg'] }}>
        <View className="flex-row items-center gap-sm">
          <MaterialIcons name="vpn-key" size={22} color={colors['on-surface-variant']} />
          <AppText variant="label-lg">{t('dashboard.inviteCodeSectionTitle')}</AppText>
        </View>
        <AppText
          variant="headline-md"
          selectable
          accessibilityLabel={inviteCode.split('').join(' ')}
          className="mt-sm"
        >
          {formatInviteCode(inviteCode)}
        </AppText>
        <View className="mt-md flex-row items-center gap-sm">
          <Button
            label={t('dashboard.shareInviteCode')}
            icon="share"
            className="flex-1"
            onPress={() => void share(inviteCode)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.copyInviteCode')}
            onPress={() => void copy(inviteCode)}
            className="h-[52px] w-[52px] items-center justify-center rounded-full bg-secondary-container active:opacity-80"
          >
            <MaterialIcons name="content-copy" size={22} color={colors['on-secondary-container']} />
          </Pressable>
        </View>
        {regenerate.isPending ? (
          <View className="min-h-touch justify-center">
            <LoadingBar width={120} />
          </View>
        ) : (
          <Button
            label={t('dashboard.regenerateInviteCode')}
            variant="text"
            className="mt-xs self-start"
            onPress={() => setConfirmingRegenerate(true)}
          />
        )}
      </Card>

      <MembersSection homeId={homeId} />

      {renaming && (
        <RenameHomeDialog
          currentName={name}
          onCancel={() => setRenaming(false)}
          onSave={(newName) => {
            setRenaming(false);
            void rename.run(newName);
          }}
        />
      )}
      <ConfirmDialog
        visible={confirmingRegenerate}
        title={t('dashboard.regenerateInviteCodeConfirmTitle')}
        body={t('dashboard.regenerateInviteCodeConfirmBody')}
        onCancel={() => setConfirmingRegenerate(false)}
        onConfirm={() => {
          setConfirmingRegenerate(false);
          void regenerate.run(inviteCode);
        }}
      />
    </ScrollView>
  );
}

// Figma'daki "haftalık rapor" fikri, yalnızca gerçek sayılarla.
function StatusCard({ homeId }: { homeId: string }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const needed = useNeededItems(homeId).data?.items.length ?? 0;
  const bought = useBoughtItems(homeId).data?.items.length ?? 0;
  const total = needed + bought;
  const progress = total === 0 ? 0 : bought / total;

  return (
    <Card>
      <View className="flex-row items-center gap-sm">
        <MaterialIcons name="check-circle-outline" size={22} color={colors.secondary} />
        <AppText variant="label-lg" tone="secondary">
          {t('dashboard.statusCardTitle')}
        </AppText>
      </View>
      <AppText variant="title-lg" className="mt-sm">
        {t('dashboard.statusCardBody', { bought, needed })}
      </AppText>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('dashboard.statusCardTitle')}
        accessibilityValue={{ min: 0, max: total, now: bought }}
        className="mt-md h-[8px] overflow-hidden rounded-sm bg-surface-container-high"
      >
        <View className="h-full rounded-sm bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
    </Card>
  );
}

function MembersSection({ homeId }: { homeId: string }) {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  const members = useMembers(homeId).data ?? [];

  return (
    <View className="mt-md gap-sm">
      <AppText variant="title-lg" accessibilityRole="header">
        {t('dashboard.membersSectionTitle')}
      </AppText>
      {members.map((member) => (
        <Card key={member.uid} padded={false} className="flex-row items-center gap-md px-lg py-sm">
          <MemberAvatar
            uid={member.uid}
            displayName={member.displayName}
            photoUrl={member.photoUrl}
            size={44}
          />
          <AppText variant="title-md" className="flex-1">
            {member.displayName}
          </AppText>
          {member.uid === uid && (
            <View className="rounded-full bg-surface-container-high px-md py-xs">
              <AppText variant="label-lg">{t('dashboard.youLabel')}</AppText>
            </View>
          )}
        </Card>
      ))}
    </View>
  );
}
