import { act, fireEvent, screen } from '@testing-library/react-native';

import { useSessionStore } from '@/features/auth/store';
import { ShellHeader } from '@/features/shell/components/shell-header';
import { ShellTabBar } from '@/features/shell/components/shell-tab-bar';
import { useToastStore } from '@/shared/components/toast/toast-store';
import { renderWithTheme, sleep } from '@/test-utils/render';

beforeEach(() => {
  useSessionStore
    .getState()
    .setUser({ uid: 'u1', displayName: 'Zeynep', email: null, photoURL: null });
});
afterEach(async () => {
  await act(async () => sleep(0));
});

describe('ShellHeader', () => {
  it('başlık, çan (okunmamış sayısıyla) ve profil düğmesi', async () => {
    const onNotifications = jest.fn();
    const onProfile = jest.fn();
    await renderWithTheme(
      <ShellHeader
        title="Alışveriş Listesi"
        unreadCount={3}
        notificationsOpen={false}
        onNotifications={onNotifications}
        onProfile={onProfile}
      />,
    );
    expect(screen.getByRole('header', { name: 'Alışveriş Listesi' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Bildirimler, 3 yeni' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Profil' }));
    expect(onNotifications).toHaveBeenCalledTimes(1);
    expect(onProfile).toHaveBeenCalledTimes(1);
  });

  it('okunmamış yoksa rozet yok', async () => {
    await renderWithTheme(
      <ShellHeader
        title="Evim"
        unreadCount={0}
        notificationsOpen={false}
        onNotifications={jest.fn()}
        onProfile={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Bildirimler' })).toBeOnTheScreen();
    expect(screen.queryByText('0')).toBeNull();
  });
});

describe('ShellTabBar', () => {
  it('Ev / Liste / Profil; seçili durumu bildirir, dokununca gider', async () => {
    const onNavigate = jest.fn();
    await renderWithTheme(<ShellTabBar active="index" onNavigate={onNavigate} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      'Ev',
      'Alışveriş listesi',
      'Profil',
    ]);
    expect(screen.getByRole('tab', { name: 'Alışveriş listesi' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Ev' }));
    expect(onNavigate).toHaveBeenCalledWith('home');
  });

  it('yüksekliğini toast için bildirir, kalkınca sıfırlar', async () => {
    const { unmount } = await renderWithTheme(<ShellTabBar active={null} onNavigate={jest.fn()} />);
    await fireEvent(screen.getByTestId('shell-tab-bar'), 'layout', {
      nativeEvent: { layout: { height: 96 } },
    });
    expect(useToastStore.getState().bottomOffset).toBe(96);
    await unmount();
    expect(useToastStore.getState().bottomOffset).toBe(0);
  });
});
