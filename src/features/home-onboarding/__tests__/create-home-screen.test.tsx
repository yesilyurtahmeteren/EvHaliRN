import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/shared/i18n';
import { signOut } from '@/features/auth/api';
import { useSessionStore } from '@/features/auth/store';
import { createHome, joinHome } from '@/features/home-onboarding/api';
import { CreateHomeScreen } from '@/features/home-onboarding/components/create-home-screen';
import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';

jest.mock('@/features/auth/api', () => ({ signInWithGoogle: jest.fn(), signOut: jest.fn() }));
jest.mock('@/features/home-onboarding/api', () => ({ createHome: jest.fn(), joinHome: jest.fn() }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

async function renderScreen() {
  useSessionStore.getState().setUser({
    uid: 'u1',
    displayName: 'Ayşe',
    email: null,
    photoURL: null,
  });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={client}>
        <CreateHomeScreen />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

const toast = () => useToastStore.getState().current?.message;

afterEach(async () => {
  await act(async () => hideToast());
  jest.clearAllMocks();
});

describe('CreateHomeScreen', () => {
  it('ev adını kırparak ev oluşturur', async () => {
    jest.mocked(createHome).mockResolvedValue('h1');
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Ev adı'), '  Yeşilyurt Evi  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Ev Oluştur' }));

    await waitFor(() =>
      expect(createHome).toHaveBeenCalledWith({ name: 'Yeşilyurt Evi', uid: 'u1' }),
    );
  });

  it('boş ev adında (Flutter gibi) hiçbir şey yapmaz', async () => {
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Ev adı'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Ev Oluştur' }));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

    expect(createHome).not.toHaveBeenCalled();
    expect(toast()).toBeUndefined();
  });

  it('klavyedeki "bitti" tuşu da gönderir', async () => {
    jest.mocked(createHome).mockResolvedValue('h1');
    await renderScreen();

    const field = screen.getByLabelText('Ev adı');
    await fireEvent.changeText(field, 'Ev');
    await fireEvent(field, 'submitEditing');

    await waitFor(() => expect(createHome).toHaveBeenCalledWith({ name: 'Ev', uid: 'u1' }));
  });

  it('oluşturma başarısızsa hata mesajı gösterir', async () => {
    jest.mocked(createHome).mockRejectedValue(new Error('unavailable'));
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Ev adı'), 'Ev');
    await fireEvent.press(screen.getByRole('button', { name: 'Ev Oluştur' }));

    await waitFor(() => expect(toast()).toBe('Ev oluşturulamadı, tekrar deneyin.'));
  });

  it('davet koduyla katılır (kod temizliği api tarafında)', async () => {
    jest.mocked(joinHome).mockResolvedValue('h1');
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Davet kodu'), 'ab7k 9tqx');
    await fireEvent.press(screen.getByRole('button', { name: 'Eve Katıl' }));

    await waitFor(() => expect(joinHome).toHaveBeenCalledWith({ code: 'ab7k 9tqx', uid: 'u1' }));
  });

  it('boşluklu kod yapıştırılabilsin diye alan 9 karakter alır', async () => {
    await renderScreen();
    expect(screen.getByLabelText('Davet kodu')).toHaveProp('maxLength', 9);
  });

  it('geçersiz kodda "Geçersiz davet kodu." gösterir', async () => {
    jest.mocked(joinHome).mockRejectedValue(new Error('invalid-code'));
    await renderScreen();

    await fireEvent.changeText(screen.getByLabelText('Davet kodu'), 'ZZZZZZZZ');
    await fireEvent.press(screen.getByRole('button', { name: 'Eve Katıl' }));

    await waitFor(() => expect(toast()).toBe('Geçersiz davet kodu.'));
  });

  it('boş kodda hiçbir şey yapmaz', async () => {
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Eve Katıl' }));
    await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));

    expect(joinHome).not.toHaveBeenCalled();
  });

  it('üst çubuktaki düğmeyle çıkış yapılır', async () => {
    jest.mocked(signOut).mockResolvedValue();
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Çıkış Yap' }));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });
});
