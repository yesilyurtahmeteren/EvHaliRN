import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/shared/i18n';
import { useSessionStore } from '@/features/auth/store';
import { ShellHeader } from '@/features/shell/components/shell-header';
import { ShellTabBar } from '@/features/shell/components/shell-tab-bar';
import { useToastStore } from '@/shared/components/toast/toast-store';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 24, left: 0, right: 0, bottom: 16 },
};

function tabBarProps(index: number) {
  const routes = ['home', 'index', 'profile'].map((name) => ({ key: `${name}-key`, name }));
  const titles: Record<string, string> = { home: 'Ev', index: 'Alışveriş', profile: 'Profil' };
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  };
  const descriptors = Object.fromEntries(
    routes.map((route) => [route.key, { options: { title: titles[route.name] } }]),
  );
  const props = {
    state: { index, routes },
    descriptors,
    navigation,
    insets: metrics.insets,
  } as unknown as BottomTabBarProps;
  return { props, navigation };
}

describe('ShellTabBar', () => {
  it('Ev / Alışveriş / Profil sekmelerini sırayla, seçili durumuyla gösterir', async () => {
    const { props } = tabBarProps(1);
    await render(<ShellTabBar {...props} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual(['Ev', 'Alışveriş', 'Profil']);
    expect(screen.getByRole('tab', { name: 'Alışveriş' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Ev' })).not.toBeSelected();
  });

  it('başka sekmeye dokununca oraya gider, seçili sekmeye dokununca gitmez', async () => {
    const { props, navigation } = tabBarProps(1);
    await render(<ShellTabBar {...props} />);

    await fireEvent.press(screen.getByRole('tab', { name: 'Profil' }));
    expect(navigation.navigate).toHaveBeenCalledWith('profile', undefined);

    navigation.navigate.mockClear();
    await fireEvent.press(screen.getByRole('tab', { name: 'Alışveriş' }));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('yüksekliğini toast için bildirir, kalkınca sıfırlar', async () => {
    const { props } = tabBarProps(1);
    const view = await render(<ShellTabBar {...props} />);

    await fireEvent(screen.getByTestId('shell-tab-bar'), 'layout', {
      nativeEvent: { layout: { height: 88 } },
    });
    expect(useToastStore.getState().bottomOffset).toBe(88);

    await view.unmount();
    expect(useToastStore.getState().bottomOffset).toBe(0);
  });
});

describe('ShellHeader', () => {
  beforeEach(async () => {
    await act(async () =>
      useSessionStore.getState().setUser({
        uid: 'u1',
        displayName: 'Ayşe',
        email: null,
        photoURL: null,
      }),
    );
  });

  it('sekme başlığını gösterir, avatara dokununca Profil açılır', async () => {
    const onAvatarPress = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <ShellHeader title="Alışveriş" profileSelected={false} onAvatarPress={onAvatarPress} />
      </SafeAreaProvider>,
    );

    expect(screen.getByRole('header', { name: 'Alışveriş' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Profil' }));
    expect(onAvatarPress).toHaveBeenCalled();
  });
});
