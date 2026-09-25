import { act, fireEvent, screen } from '@testing-library/react-native';

import { useSessionStore } from '@/features/auth/store';
import { HomeDashboardScreen } from '@/features/home-dashboard/components/home-dashboard-screen';
import { useShellUi } from '@/features/shell/ui-store';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import { renderWithTheme, sleep } from '@/test-utils/render';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/router-mock').mockExpoRouter());
jest.mock('@/features/home-dashboard/api', () => ({
  renameHome: jest.fn(),
  regenerateInviteCode: jest.fn(),
  setMemberRoles: jest.fn(),
  removeMember: jest.fn(),
}));
jest.mock('@/shared/hooks/use-home', () => ({ useHome: jest.fn(), useMembers: jest.fn() }));
jest.mock('@/shared/hooks/use-items', () => ({
  useNeededItems: jest.fn(),
  useBoughtItems: jest.fn(),
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()) }));

function setData(roles: Record<string, string> | null) {
  jest.mocked(useHome).mockReturnValue({
    isPending: false,
    isError: false,
    data: {
      id: 'h1',
      name: 'Yılmaz Ailesi',
      memberIds: ['u1', 'u2'],
      inviteCode: 'AB7K9TQX',
      roles,
    },
  } as never);
  jest.mocked(useMembers).mockReturnValue({
    data: [
      { uid: 'u1', displayName: 'Zeynep Yılmaz', photoUrl: null },
      { uid: 'u2', displayName: 'Emre Yılmaz', photoUrl: null },
    ],
  } as never);
  const bought = Array.from({ length: 9 }, (_, i) => ({ id: `b${i}`, boughtAt: new Date() }));
  jest.mocked(useBoughtItems).mockReturnValue({ data: { items: bought } } as never);
  jest.mocked(useNeededItems).mockReturnValue({ data: { items: [{ id: 'n' }] } } as never);
}

afterEach(async () => {
  await act(async () => sleep(0));
  jest.clearAllMocks();
});

describe('HomeDashboardScreen', () => {
  it('karşılama, haftalık özet, ev kodu ve aile bireyleri (rollerle)', async () => {
    useSessionStore
      .getState()
      .setUser({ uid: 'u1', displayName: 'Zeynep', email: null, photoURL: null });
    setData({ u1: 'admin', u2: 'child' });
    await renderWithTheme(<HomeDashboardScreen />, { homeId: 'h1' });

    expect(screen.getByRole('header', { name: 'Yılmaz Ailesi' })).toBeOnTheScreen();
    expect(screen.getByText('2 kişi aynı listeyi paylaşıyor')).toBeOnTheScreen();
    expect(screen.getByText('9 ihtiyaç alındı')).toBeOnTheScreen();
    expect(screen.getByText("Listenin %90'ı tamamlandı")).toBeOnTheScreen();
    expect(screen.getByText('AB7K-9TQX')).toBeOnTheScreen();
    expect(screen.getByText('Ev yöneticisi')).toBeOnTheScreen();
    expect(screen.getByText('Üye (çocuk)')).toBeOnTheScreen();
    expect(screen.getByText('İpucu: Sesle ekleyin')).toBeOnTheScreen();
  });

  it('Kopyala 1.8 sn "Kopyalandı" olur', async () => {
    useSessionStore
      .getState()
      .setUser({ uid: 'u2', displayName: 'Emre', email: null, photoURL: null });
    setData({ u1: 'admin' });
    await renderWithTheme(<HomeDashboardScreen />, { homeId: 'h1' });
    await fireEvent.press(screen.getByRole('button', { name: 'Kopyala' }));
    await act(async () => sleep(0));
    expect(screen.getByRole('button', { name: 'Kopyalandı' })).toBeOnTheScreen();
  });

  it('yalnızca yönetici ev adını değiştirir ve üye rolünü düzenler', async () => {
    useSessionStore
      .getState()
      .setUser({ uid: 'u1', displayName: 'Zeynep', email: null, photoURL: null });
    setData({ u1: 'admin' });
    await renderWithTheme(<HomeDashboardScreen />, { homeId: 'h1' });
    expect(screen.getByRole('button', { name: 'Ev adını değiştir' })).toBeOnTheScreen();
    await fireEvent.press(screen.getAllByRole('button', { name: /Emre Yılmaz/ })[0]);
    expect(useShellUi.getState().sheet).toEqual({ kind: 'member', uid: 'u2' });
    await act(async () => useShellUi.getState().sheetClosed());
  });

  it('üye ev adını değiştiremez, kodu yenileyemez', async () => {
    useSessionStore
      .getState()
      .setUser({ uid: 'u2', displayName: 'Emre', email: null, photoURL: null });
    setData({ u1: 'admin' });
    await renderWithTheme(<HomeDashboardScreen />, { homeId: 'h1' });
    expect(screen.queryByRole('button', { name: 'Ev adını değiştir' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Yeni kod oluştur' })).toBeNull();
  });
});
