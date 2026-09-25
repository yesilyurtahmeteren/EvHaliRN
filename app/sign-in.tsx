import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSignIn } from '@/features/auth/hooks/use-auth-actions';
import { Button } from '@/shared/components/button';
import { PlaceholderScreen } from '@/shared/components/placeholder-screen';

// Faz 3: korumalı rotaları cihazda denemek için yalnızca çalışan giriş
// düğmesi. Figma tasarımlı gerçek ekran Faz 4 "auth" adımında gelecek.
export default function SignInScreen() {
  const { t } = useTranslation();
  const signIn = useSignIn();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <PlaceholderScreen title={t('screens.signIn')} showLinks={false}>
        <Button
          label={t('auth.signInWithGoogle')}
          icon="login"
          fullWidth
          loading={signIn.isPending}
          onPress={() => void signIn.run()}
        />
      </PlaceholderScreen>
    </SafeAreaView>
  );
}
