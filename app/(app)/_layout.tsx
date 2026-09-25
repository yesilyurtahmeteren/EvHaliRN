import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useRequiredUser } from '@/features/auth/store';
import { useHomeGate } from '@/features/home-onboarding/hooks/use-home-gate';
import { usePushTokenSync } from '@/features/notifications/hooks/use-push-token-sync';
import { ErrorView, LoadingScreen } from '@/shared/components/states';
import { HomeIdProvider } from '@/shared/hooks/home-id';

// Buraya yalnızca oturum açıkken gelinir (app/_layout.tsx, Stack.Protected).
// HomeGate: users/{uid} yüklenirken bekleme, okunamazsa "Ev bilgisi
// yüklenemedi", homeId yoksa yalnızca Ev Oluştur, varsa sekmeler.
export default function AppLayout() {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  const gate = useHomeGate();
  // Flutter HomeGate gibi: oturum açılınca, ev durumundan bağımsız.
  usePushTokenSync(uid);

  if (gate.status === 'loading') {
    return <LoadingScreen />;
  }
  if (gate.status === 'error') {
    return <ErrorView message={t('home.loadError')} onRetry={gate.retry} />;
  }

  const hasHome = gate.homeId !== null;
  return (
    <HomeIdProvider homeId={gate.homeId}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={hasHome}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!hasHome}>
          <Stack.Screen name="create-home" />
        </Stack.Protected>
      </Stack>
    </HomeIdProvider>
  );
}
