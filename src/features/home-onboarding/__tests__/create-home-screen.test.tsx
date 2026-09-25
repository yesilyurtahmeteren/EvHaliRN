import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/features/auth/store';
import { createHome, joinHome } from '@/features/home-onboarding/api';
import { CreateHomeScreen } from '@/features/home-onboarding/components/create-home-screen';
import { useToastStore } from '@/shared/components/toast/toast-store';
import { renderWithTheme, sleep } from '@/test-utils/render';

jest.mock('@/features/home-onboarding/api', () => ({
  createHome: jest.fn(() => Promise.resolve('h1')),
  joinHome: jest.fn(() => Promise.resolve('h1')),
}));
jest.mock('@/features/auth/api', () => ({ signOut: jest.fn(() => Promise.resolve()) }));
jest.mock('@react-native-firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

beforeEach(() => {
  useSessionStore
    .getState()
    .setUser({ uid: 'u1', displayName: 'Zeynep', email: null, photoURL: null });
});
afterEach(async () => {
  await act(async () => sleep(0));
  jest.clearAllMocks();
});

describe('CreateHomeScreen', () => {
  it('boş adla ev oluşturmaz, adla oluşturur', async () => {
    await renderWithTheme(<CreateHomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Ev Oluştur' }));
    expect(createHome).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText('Evinizin adı'), '  Yılmaz Ailesi ');
    await fireEvent.press(screen.getByRole('button', { name: 'Ev Oluştur' }));
    expect(createHome).toHaveBeenCalledWith({ name: 'Yılmaz Ailesi', uid: 'u1' });
  });

  it('ev koduyla katılır; geçersiz kodda anlaşılır mesaj', async () => {
    jest.mocked(joinHome).mockRejectedValueOnce(new Error('invalid-code'));
    await renderWithTheme(<CreateHomeScreen />);
    await fireEvent.changeText(screen.getByLabelText('Ev kodu'), 'ab7k-9tqx');
    await fireEvent.press(screen.getByRole('button', { name: 'Eve Katıl' }));
    expect(joinHome).toHaveBeenCalledWith({ code: 'ab7k-9tqx', uid: 'u1' });
    await waitFor(() =>
      expect(useToastStore.getState().current?.message).toBe(
        'Bu kodla bir ev bulunamadı. Kodu kontrol edin.',
      ),
    );
  });
});
