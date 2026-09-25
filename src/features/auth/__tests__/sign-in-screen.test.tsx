import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/shared/i18n';
import { signInWithGoogle } from '@/features/auth/api';
import { SignInScreen } from '@/features/auth/components/sign-in-screen';
import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';

jest.mock('@/features/auth/api', () => ({
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

const mockSignIn = jest.mocked(signInWithGoogle);

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderScreen() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <SignInScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

afterEach(async () => {
  // TanStack'in setTimeout(0) ile geciktirdiği son durum bildirimi act içinde
  // boşaltılsın ("not wrapped in act" uyarısı olmasın).
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
  await act(async () => hideToast());
  jest.clearAllMocks();
});

describe('SignInScreen', () => {
  it('Figma giriş ekranı metinlerini gösterir', async () => {
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Ev Hali' })).toBeOnTheScreen();
    expect(screen.getByText('Evinizin ortak alışveriş listesi ve aile bereketi')).toBeOnTheScreen();
    expect(screen.getByText('Ailece güvenli ve senkronize alışveriş deneyimi')).toBeOnTheScreen();
  });

  it('giriş sürerken düğme yerine ilerleme çubuğu gösterir', async () => {
    let finish: (value: 'success') => void = () => undefined;
    mockSignIn.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Google ile Devam Et' }));
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    // TanStack durum değişimini bir sonraki tick'te bildiriyor.
    await waitFor(() => expect(screen.getByRole('progressbar')).toBeOnTheScreen());
    expect(screen.queryByRole('button')).toBeNull();

    await act(async () => finish('success'));
    await waitFor(() => expect(screen.getByRole('button')).toBeOnTheScreen());
  });

  it('giriş başarısızsa "Giriş yapılamadı" mesajı ve düğme geri gelir', async () => {
    mockSignIn.mockRejectedValue(new Error('DEVELOPER_ERROR'));
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Google ile Devam Et' }));

    await waitFor(() =>
      expect(useToastStore.getState().current?.message).toBe('Giriş yapılamadı, tekrar deneyin.'),
    );
    expect(screen.getByRole('button', { name: 'Google ile Devam Et' })).toBeOnTheScreen();
  });

  it('kullanıcı hesap seçiciyi kapatırsa hata göstermez', async () => {
    mockSignIn.mockResolvedValue('cancelled');
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Google ile Devam Et' }));

    await waitFor(() => expect(screen.getByRole('button')).toBeOnTheScreen());
    expect(useToastStore.getState().current).toBeNull();
  });
});
