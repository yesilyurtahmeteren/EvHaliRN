import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useHomeGate } from '@/features/home-onboarding/hooks/use-home-gate';
import { ErrorView, LoadingScreen } from '@/shared/components/states';
import { HomeIdProvider } from '@/shared/hooks/home-id';

// Buraya yalnızca oturum açıkken gelinir (app/_layout.tsx, Stack.Protected).
// HomeGate: users/{uid} yüklenirken bekleme, okunamazsa "Ev bilgisi
// yüklenemedi", homeId yoksa yalnızca Ev Oluştur, varsa sekmeler.
export default function AppLayout() {
  const { t } = useTranslation();
  const gate = useHomeGate();

  if (gate.status === 'loading') {
    return <LoadingScreen />;
  }
  if (gate.status === 'error') {
    return <ErrorView message={t('home.loadError')} onRetry={gate.retry} />;
  }

  const hasHome = gate.homeId !== null;
  return (
    <HomeIdProvider homeId={gate.homeId}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={hasHome}>
          <Stack.Screen name="(tabs)" />
          {/* Kendi alt sayfa görünümünü çizer (tutamak, köşeler, arka plan
              karartması); native formSheet Android'de klavyeyle sorunlu. */}
          <Stack.Screen
            name="item-form"
            options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!hasHome}>
          <Stack.Screen name="create-home" />
        </Stack.Protected>
      </Stack>
    </HomeIdProvider>
  );
}
