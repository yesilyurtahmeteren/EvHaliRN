import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSignOut } from '@/features/auth/hooks/use-auth-actions';
import { useRequiredUser } from '@/features/auth/store';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { PlaceholderScreen } from '@/shared/components/placeholder-screen';

// Faz 3: oturum bilgisini ve çıkışı cihazda denemek için. Gerçek Profil
// ekranı Faz 4 "shell + profile" adımında gelecek.
export default function ProfileTabScreen() {
  const { t } = useTranslation();
  const user = useRequiredUser();
  const signOut = useSignOut();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-surface">
      <PlaceholderScreen title={t('nav.profile')}>
        <AppText variant="title-md">{user.displayName ?? user.uid}</AppText>
        <Button
          label={t('auth.signOut')}
          variant="secondary"
          icon="logout"
          loading={signOut.isPending}
          onPress={() => void signOut.run()}
        />
      </PlaceholderScreen>
    </SafeAreaView>
  );
}
