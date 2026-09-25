import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { signInWithGoogle } from '@/features/auth/api';
import { SignInScreen } from '@/features/auth/components/sign-in-screen';
import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';
import { renderWithTheme, sleep } from '@/test-utils/render';

jest.mock('@/features/auth/api', () => ({ signInWithGoogle: jest.fn(), signOut: jest.fn() }));
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: () => ({ currentUser: { displayName: 'Zeynep Yılmaz' } }),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

const mockSignIn = jest.mocked(signInWithGoogle);

afterEach(async () => {
  await act(async () => sleep(0));
  await act(async () => hideToast());
  jest.clearAllMocks();
});

describe('SignInScreen', () => {
  it('tasarımdaki metinleri gösterir', async () => {
    await renderWithTheme(<SignInScreen />);
    expect(screen.getByRole('header', { name: 'Ev Hali' })).toBeOnTheScreen();
    expect(
      screen.getByText('Evinizin ortak alışveriş listesi. Kolay, sade, herkes için.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Bilgileriniz güvende')).toBeOnTheScreen();
  });

  it('girişte "Giriş yapılıyor…" gösterir, başarıda ilk adla karşılar', async () => {
    let resolve: (value: 'success') => void = () => undefined;
    mockSignIn.mockReturnValue(new Promise((r) => (resolve = r)));
    await renderWithTheme(<SignInScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Google ile Giriş Yap' }));
    const busy = await screen.findByRole('button', { name: 'Giriş yapılıyor…' });
    expect(busy).toBeDisabled();

    await act(async () => resolve('success'));
    await waitFor(() =>
      expect(useToastStore.getState().current?.message).toBe('Hoş geldiniz, Zeynep'),
    );
  });

  it('hesap seçici kapatılırsa hata ya da karşılama göstermez', async () => {
    mockSignIn.mockResolvedValue('cancelled');
    await renderWithTheme(<SignInScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Google ile Giriş Yap' }));
    await act(async () => sleep(0));
    expect(useToastStore.getState().current).toBeNull();
  });

  it('hata olursa anlaşılır mesaj gösterir', async () => {
    mockSignIn.mockRejectedValue(new Error('network'));
    await renderWithTheme(<SignInScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Google ile Giriş Yap' }));
    await waitFor(() =>
      expect(useToastStore.getState().current?.message).toBe(
        'Giriş yapılamadı, lütfen tekrar deneyin.',
      ),
    );
  });
});
