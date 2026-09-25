import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/features/auth/store';
import { leaveHome, setNotificationPref, setTextScale } from '@/features/profile/api';
import { ProfileScreen } from '@/features/profile/components/profile-screen';
import { useToastStore } from '@/shared/components/toast/toast-store';
import { useHome } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import { useUserDoc } from '@/shared/hooks/use-user-doc';
import { useThemeStore } from '@/shared/theme/theme-store';
import { renderWithTheme, sleep } from '@/test-utils/render';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/router-mock').mockExpoRouter());
jest.mock('@/features/profile/api', () => ({
  leaveHome: jest.fn(() => Promise.resolve()),
  setNotificationPref: jest.fn(() => Promise.resolve()),
  setTextScale: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/features/auth/api', () => ({ signOut: jest.fn(), deleteAccount: jest.fn() }));
jest.mock('@react-native-firebase/auth', () => ({ getAuth: () => ({ currentUser: null }) }));
jest.mock('@/shared/hooks/use-home', () => ({ useHome: jest.fn() }));
jest.mock('@/shared/hooks/use-user-doc', () => ({ useUserDoc: jest.fn() }));
jest.mock('@/shared/hooks/use-items', () => ({
  useNeededItems: jest.fn(),
  useBoughtItems: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

function setData(roles: Record<string, string>, memberIds = ['u1', 'u2']) {
  jest.mocked(useHome).mockReturnValue({
    data: { id: 'h1', name: 'Ev', memberIds, inviteCode: 'X', roles },
  } as never);
  jest.mocked(useUserDoc).mockReturnValue({
    data: {
      uid: 'u1',
      displayName: 'Zeynep',
      homeId: 'h1',
      notificationsEnabled: true,
      textScale: 1,
    },
  } as never);
  jest.mocked(useNeededItems).mockReturnValue({ data: { items: [] } } as never);
  jest.mocked(useBoughtItems).mockReturnValue({ data: { items: [] } } as never);
}

beforeEach(() => {
  useSessionStore.getState().setUser({
    uid: 'u1',
    displayName: 'Zeynep Yılmaz',
    email: 'zeynep@example.com',
    photoURL: null,
  });
});
afterEach(async () => {
  await act(async () => sleep(0));
  jest.clearAllMocks();
});

describe('ProfileScreen', () => {
  it('kimlik kartı, rol hapı ve istatistik etiketleri', async () => {
    setData({ u1: 'admin' });
    await renderWithTheme(<ProfileScreen />, { homeId: 'h1' });
    expect(screen.getByText('Zeynep Yılmaz')).toBeOnTheScreen();
    expect(screen.getByText('zeynep@example.com')).toBeOnTheScreen();
    expect(screen.getByText('Ev yöneticisi')).toBeOnTheScreen();
    expect(screen.getByText('Bekleyen')).toBeOnTheScreen();
  });

  it('tema seçimi kalıcı mağazaya yazılır', async () => {
    setData({ u1: 'admin' });
    await renderWithTheme(<ProfileScreen />, { homeId: 'h1' });
    await fireEvent.press(screen.getByRole('radio', { name: 'Koyu' }));
    expect(useThemeStore.getState().mode).toBe('dark');
    await fireEvent.press(screen.getByRole('radio', { name: 'Aydınlık' }));
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('büyük yazı 1.14, bildirim tercihleri ayrı ayrı yazılır', async () => {
    setData({ u1: 'admin' });
    await renderWithTheme(<ProfileScreen />, { homeId: 'h1' });
    await fireEvent.press(screen.getByRole('switch', { name: 'Büyük yazı' }));
    expect(setTextScale).toHaveBeenCalledWith({ uid: 'u1', textScale: 1.14 });
    await fireEvent.press(screen.getByRole('switch', { name: 'Alınanlar' }));
    expect(setNotificationPref).toHaveBeenCalledWith({
      uid: 'u1',
      pref: 'notifyBought',
      enabled: false,
    });
  });

  it('tek yönetici evden ayrılmadan önce yöneticiliği devretmeli', async () => {
    setData({ u1: 'admin' });
    await renderWithTheme(<ProfileScreen />, { homeId: 'h1' });
    await fireEvent.press(screen.getByRole('button', { name: 'Evden ayrıl' }));
    expect(useToastStore.getState().current?.message).toBe(
      'Ayrılmadan önce Evim ekranından başka bir üyeyi yönetici yapın.',
    );
    expect(leaveHome).not.toHaveBeenCalled();
  });

  it('üye onaylayarak evden ayrılır', async () => {
    useSessionStore
      .getState()
      .setUser({ uid: 'u2', displayName: 'Emre', email: null, photoURL: null });
    setData({ u1: 'admin' });
    await renderWithTheme(<ProfileScreen />, { homeId: 'h1' });
    await fireEvent.press(screen.getByRole('button', { name: 'Evden ayrıl' }));
    const confirm = screen.getAllByRole('button', { name: 'Evden ayrıl' });
    await fireEvent.press(confirm[confirm.length - 1]);
    await waitFor(() =>
      expect(leaveHome).toHaveBeenCalledWith({ homeId: 'h1', uid: 'u2', hasRoles: true }),
    );
  });
});
