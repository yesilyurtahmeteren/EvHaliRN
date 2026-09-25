// Ekran/bileşen testleri için ortak sarmalayıcı: güvenli alan, tema (renkler
// Reanimated ile temadan türediği için AppThemeProvider şart), sorgu
// istemcisi ve isteğe bağlı ev bağlamı.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/shared/i18n';
import { HomeIdProvider } from '@/shared/hooks/home-id';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

export const testMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function renderWithTheme(ui: ReactElement, { homeId }: { homeId?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const content = homeId === undefined ? ui : <HomeIdProvider homeId={homeId}>{ui}</HomeIdProvider>;
  return render(
    <SafeAreaProvider initialMetrics={testMetrics}>
      <QueryClientProvider client={client}>
        <AppThemeProvider>{content}</AppThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

// TanStack'in son durum bildirimi ve kısa zamanlayıcılar act içinde boşalsın.
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
