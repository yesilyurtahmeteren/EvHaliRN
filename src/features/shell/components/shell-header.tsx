import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessionStore } from '@/features/auth/store';
import { AppIconMark } from '@/shared/components/app-icon-mark';
import { AppText } from '@/shared/components/app-text';
import { Avatar } from '@/shared/components/avatar';

// Flutter MainShell AppBar: solda logo, ortada sekme başlığı, sağda
// avatar (dokununca Profil sekmesi). Profil seçiliyken avatar vurgulanır.
export function ShellHeader({
  title,
  profileSelected,
  onAvatarPress,
}: {
  title: string;
  profileSelected: boolean;
  onAvatarPress: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const photoUrl = useSessionStore((s) => (s.user ?? s.lastUser)?.photoURL ?? null);

  return (
    <View style={{ paddingTop: insets.top }} className="bg-surface">
      <View className="h-[64px] flex-row items-center px-sm">
        <View className="w-[56px] items-start pl-xs">
          <AppIconMark size={32} />
        </View>
        <AppText variant="title-lg" accessibilityRole="header" className="flex-1 text-center">
          {title}
        </AppText>
        <View className="w-[56px] items-end pr-md">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.profile')}
            accessibilityState={{ selected: profileSelected }}
            hitSlop={8}
            onPress={onAvatarPress}
            className={`rounded-full ${profileSelected ? 'border-2 border-primary' : ''}`}
          >
            <Avatar photoUrl={photoUrl} size={36} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
