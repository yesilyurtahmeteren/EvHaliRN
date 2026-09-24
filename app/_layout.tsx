import '@/global.css';
import '@/shared/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/shared/lib/query-client';
import { AppThemeProvider, useAppTheme } from '@/shared/theme/theme-provider';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { scheme } = useAppTheme();

  // Fontlar expo-font eklentisiyle APK'ya gömülü (çalışma anında yüklenmiyor),
  // bu yüzden ilk render'da açılış ekranı kapatılabilir. Faz 3'te oturum
  // durumu belli olana kadar bekletilecek.
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="(app)" />
      </Stack>
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
