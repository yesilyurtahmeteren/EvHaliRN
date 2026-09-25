import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { useRequiredUser } from '@/features/auth/store';
import { AppText } from '@/shared/components/app-text';
import { Avatar } from '@/shared/components/avatar';
import { Card } from '@/shared/components/card';
import { Chip } from '@/shared/components/chip';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { LoadingBar } from '@/shared/components/loading-bar';
import { useUserDoc } from '@/shared/hooks/use-user-doc';
import { textScaleOptions } from '@/shared/schemas';
import type { ColorToken } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';
import { useThemeStore } from '@/shared/theme/theme-store';

import {
  useLeaveHome,
  useSetNotificationsEnabled,
  useSetTextScale,
} from '../hooks/use-profile-actions';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const textScaleLabelKeys = {
  0.9: 'profile.textScaleSmall',
  1: 'profile.textScaleNormal',
  1.15: 'profile.textScaleLarge',
  1.3: 'profile.textScaleExtraLarge',
} as const;

// Flutter screens/profile_screen.dart (Figma "Profil"): kimlik kartı,
// görünüm (karanlık mod), bildirim tercihi, yazı boyutu, hesap & güvenlik.
// Figma'daki "Hesabı Sil" ve harcama istatistikleri Flutter'da da bilerek yok.
export function ProfileScreen() {
  const { t } = useTranslation();
  const { scheme } = useAppTheme();
  const user = useRequiredUser();
  const { data: appUser } = useUserDoc();
  const setThemeMode = useThemeStore((s) => s.setMode);
  const signOut = useSignOut();
  const leaveHome = useLeaveHome();
  const setNotifications = useSetNotificationsEnabled();
  const setTextScale = useSetTextScale();
  const [confirmingLeave, setConfirmingLeave] = useState(false);

  const isDark = scheme === 'dark';
  const homeId = appUser?.homeId ?? null;
  const textScale = appUser?.textScale ?? 1;

  const confirmLeave = () => {
    setConfirmingLeave(false);
    if (homeId !== null) {
      void leaveHome.run(homeId);
    }
  };

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="gap-sm p-lg pb-xxl">
      <Card className="items-center">
        <Avatar photoUrl={user.photoURL} size={88} />
        <AppText variant="headline-md" className="mt-md text-center">
          {user.displayName ?? ''}
        </AppText>
        <AppText variant="body-md" tone="on-surface-variant" className="mt-xs text-center">
          {user.email ?? ''}
        </AppText>
      </Card>

      <SectionLabel>{t('profile.appearanceSectionTitle')}</SectionLabel>
      <Card>
        <SwitchRow
          icon={isDark ? 'dark-mode' : 'light-mode'}
          iconTone="primary"
          title={t('profile.darkModeLabel')}
          subtitle={isDark ? t('profile.darkModeOnSubtitle') : t('profile.darkModeOffSubtitle')}
          value={isDark}
          onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
        />
      </Card>

      <SectionLabel>{t('profile.notificationsSectionTitle')}</SectionLabel>
      <Card>
        <SwitchRow
          icon="notifications-active"
          iconTone="secondary"
          title={t('profile.notificationsEnabledLabel')}
          value={appUser?.notificationsEnabled ?? true}
          onValueChange={(value) => void setNotifications.run(value)}
        />
      </Card>

      <SectionLabel>{t('profile.textScaleSectionTitle')}</SectionLabel>
      <Card>
        {/* Wrap: "Çok büyük" yazı ölçeğinde tek satıra sığmayan çip alta iner. */}
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-sm">
          {textScaleOptions.map((option) => (
            <Chip
              key={option}
              label={t(textScaleLabelKeys[option])}
              selected={textScale === option}
              onPress={() => void setTextScale.run(option)}
            />
          ))}
        </View>
        <AppText variant="title-md" className="mt-sm">
          {t('profile.textScalePreviewLabel')}
        </AppText>
      </Card>

      <SectionLabel>{t('profile.accountSecuritySectionTitle')}</SectionLabel>
      <Card padded={false} className="overflow-hidden">
        <ActionRow
          icon="logout"
          title={t('auth.signOut')}
          disabled={signOut.isPending}
          onPress={() => void signOut.run()}
        />
        {homeId !== null && (
          <>
            <View className="h-px bg-outline-variant" />
            {leaveHome.isPending ? (
              <View className="p-md">
                <LoadingBar width={160} />
              </View>
            ) : (
              <ActionRow
                icon="exit-to-app"
                title={t('profile.leaveHome')}
                tone="error"
                onPress={() => setConfirmingLeave(true)}
              />
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        visible={confirmingLeave}
        title={t('profile.leaveHomeConfirmTitle')}
        body={t('profile.leaveHomeConfirmBody')}
        onCancel={() => setConfirmingLeave(false)}
        onConfirm={confirmLeave}
      />
    </ScrollView>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <AppText
      variant="label-lg"
      tone="on-surface-variant"
      accessibilityRole="header"
      className="ml-xs mt-lg"
    >
      {children}
    </AppText>
  );
}

// Flutter SwitchListTile: satırın tamamına dokunmak da anahtarı çevirir.
function SwitchRow({
  icon,
  iconTone,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: IconName;
  iconTone: ColorToken;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      className="min-h-touch flex-row items-center gap-md"
    >
      <MaterialIcons name={icon} size={24} color={colors[iconTone]} />
      <View className="flex-1">
        <AppText variant="body-lg">{title}</AppText>
        {subtitle !== undefined && (
          <AppText variant="body-md" tone="on-surface-variant">
            {subtitle}
          </AppText>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        importantForAccessibility="no-hide-descendants"
        trackColor={{ false: colors['surface-container-highest'], true: colors.primary }}
        thumbColor={value ? colors['on-primary'] : colors.outline}
      />
    </Pressable>
  );
}

// Flutter ListTile (Hesap & Güvenlik satırları).
function ActionRow({
  icon,
  title,
  tone = 'on-surface',
  disabled,
  onPress,
}: {
  icon: IconName;
  title: string;
  tone?: ColorToken;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      className="min-h-[56px] flex-row items-center gap-md px-md active:bg-surface-container-high"
    >
      <MaterialIcons
        name={icon}
        size={24}
        color={tone === 'on-surface' ? colors['on-surface-variant'] : colors[tone]}
      />
      <AppText variant="body-lg" tone={tone}>
        {title}
      </AppText>
    </Pressable>
  );
}
