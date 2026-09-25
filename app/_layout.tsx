import '@/global.css';
import '@/shared/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthListener } from '@/features/auth/hooks/use-auth-listener';
import { useSessionStore } from '@/features/auth/store';
import { ToastHost } from '@/shared/components/toast/toast-host';
import { initAppCheck } from '@/shared/lib/firebase/app-check';
import { queryClient } from '@/shared/lib/query-client';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/theme-provider';

void SplashScreen.preventAutoHideAsync();
// Herhangi bir Auth/Firestore isteğinden önce (Flutter main.dart ile aynı sıra).
initAppCheck();

function RootNavigator() {
  const { scheme } = useAppTheme();
  useAuthListener();
  const status = useSessionStore((s) => s.status);
  const signedIn = status === 'signedIn';

  // Fontlar APK'ya gömülü; açılış ekranı yalnızca oturum durumu belli olana
  // kadar bekler (Flutter AuthGate'in "bekliyor" hali), böylece giriş
  // ekranı oturumu açık kullanıcıya bir an bile görünmez.
  useEffect(() => {
    if (status !== 'initializing') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  // Korumalı rotalar (Flutter AuthGate): oturum yoksa yalnızca /sign-in,
  // varsa yalnızca (app). Durum değişince Expo Router kendiliğinden
  // yönlendirir. Ev durumu (HomeGate) (app)/_layout.tsx'te (Faz 4).
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <RootNavigator />
          </AppThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
