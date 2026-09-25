// Yükleniyor / hata / boş durumları. Flutter'da bunlar ekran içinde satır
// içi yazılıyordu (AuthGate/HomeGate spinner'ı, "Ev bilgisi yüklenemedi",
// "Evde eksik bir şey yok"); burada tek yerde.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';
import { Button } from './button';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

// Tam ekran ilk yükleme (Flutter AuthGate/HomeGate: CircularProgressIndicator).
export function LoadingScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View className="flex-1 items-center justify-center bg-surface">
      <ActivityIndicator
        size="large"
        color={colors.primary}
        accessibilityLabel={t('common.loading')}
      />
    </View>
  );
}

// Okuma hatası. "Veri yok" ile karıştırılmaz: kullanıcı tekrar deneyebilir.
export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View className="flex-1 items-center justify-center gap-lg bg-surface p-xl">
      <MaterialIcons name="cloud-off" size={48} color={colors['on-surface-variant']} />
      <AppText variant="body-lg" className="text-center">
        {message}
      </AppText>
      {onRetry !== undefined && <Button label={t('common.retry')} onPress={onRetry} />}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View className="items-center gap-sm px-xl pt-[72px]">
      <MaterialIcons name={icon} size={64} color={colors['on-surface-variant']} />
      <AppText variant="body-lg" className="mt-md text-center">
        {title}
      </AppText>
      {description !== undefined && (
        <AppText variant="body-md" tone="on-surface-variant" className="text-center">
          {description}
        </AppText>
      )}
    </View>
  );
}
