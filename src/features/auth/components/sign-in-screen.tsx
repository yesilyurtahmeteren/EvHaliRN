import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconMark } from '@/shared/components/app-icon-mark';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { LoadingBar } from '@/shared/components/loading-bar';
import { useAppTheme } from '@/shared/theme/theme-provider';

import { useSignIn } from '../hooks/use-auth-actions';

// Flutter screens/sign_in_screen.dart karşılığı (Figma "Giriş"): ortada logo,
// uygulama adı ve alt yazı; altta Google düğmesi ve güven ibaresi.
// Başarılı girişte yönlendirme yok: korumalı rotalar oturum değişince
// kendiliğinden (app)'e geçer.
export function SignInScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const signIn = useSignIn();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center px-xl">
        <View className="flex-[3]" />
        <AppIconMark size={112} />
        <AppText variant="display-lg" accessibilityRole="header" className="mt-xl text-center">
          {t('common.appName')}
        </AppText>
        <AppText variant="body-lg" tone="on-surface-variant" className="mt-sm text-center">
          {t('auth.signInSubtitle')}
        </AppText>
        <View className="flex-[4]" />

        {/* Flutter: işlem sürerken düğme yerine 240 genişliğinde LoadingBar. */}
        {signIn.isPending ? (
          <View className="min-h-[52px] justify-center">
            <LoadingBar width={240} />
          </View>
        ) : (
          <Button
            label={t('auth.signInWithGoogle')}
            icon="login"
            fullWidth
            onPress={() => void signIn.run()}
          />
        )}

        <View className="mb-xl mt-lg flex-row items-center justify-center gap-xs">
          <MaterialIcons name="shield" size={16} color={colors['on-surface-variant']} />
          <AppText variant="body-sm" tone="on-surface-variant" className="shrink text-center">
            {t('auth.signInTrustCaption')}
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}
