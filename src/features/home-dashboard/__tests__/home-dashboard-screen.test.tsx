import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import '@/shared/i18n';
import { useSessionStore } from '@/features/auth/store';
import { regenerateInviteCode, renameHome } from '@/features/home-dashboard/api';
import { HomeDashboardScreen } from '@/features/home-dashboard/components/home-dashboard-screen';
import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';
import { HomeIdProvider } from '@/shared/hooks/home-id';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';

jest.mock('@/features/home-dashboard/api', () => ({
  renameHome: jest.fn(() => Promise.resolve()),
  regenerateInviteCode: jest.fn(() => Promise.resolve('NEWC0DE2')),
}));
jest.mock('@/shared/hooks/use-home', () => ({ useHome: jest.fn(), useMembers: jest.fn() }));
jest.mock('@/shared/hooks/use-items', () => ({
  useNeededItems: jest.fn(),
  useBoughtItems: jest.fn(),
}));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(() => Promise.resolve(true)) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

const items = (n: number) => ({ data: { items: Array.from({ length: n }), fromCache: false } });

beforeEach(() => {
  jest.mocked(useHome).mockReturnValue({
    isPending: false,
    isError: false,
    data: { id: 'h1', name: 'Yeşilyurt Evi', memberIds: ['u1', 'u2'], inviteCode: 'AB7K9TQX' },
  } as never);
  jest.mocked(useMembers).mockReturnValue({
    data: [
      { uid: 'u1', displayName: 'Ayşe', photoUrl: null },
      { uid: 'u2', displayName: 'Mehmet', photoUrl: null },
    ],
  } as never);
  jest.mocked(useNeededItems).mockReturnValue(items(3) as never);
  jest.mocked(useBoughtItems).mockReturnValue(items(2) as never);
});

afterEach(async () => {
  await act(async () => hideToast());
  jest.clearAllMocks();
});

async function renderScreen() {
  useSessionStore
    .getState()
    .setUser({ uid: 'u1', displayName: 'Ayşe', email: null, photoURL: null });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <HomeIdProvider homeId="h1">
        <HomeDashboardScreen />
      </HomeIdProvider>
    </QueryClientProvider>,
  );
}

const toast = () => useToastStore.getState().current?.message;

describe('HomeDashboardScreen', () => {
  it('ev adını, gerçek durum sayılarını ve biçimli davet kodunu gösterir', async () => {
    await renderScreen();

    expect(screen.getByRole('header', { name: 'Yeşilyurt Evi' })).toBeOnTheScreen();
    expect(screen.getByText('2 tamamlandı, 3 bekleyen ürün')).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ min: 0, max: 5, now: 2 });
    expect(screen.getByText('AB7K 9TQX')).toBeOnTheScreen();
  });

  it('üyeleri sırasıyla listeler, kendini "Sen" ile işaretler', async () => {
    await renderScreen();
    expect(screen.getByText('Ayşe')).toBeOnTheScreen();
    expect(screen.getByText('Mehmet')).toBeOnTheScreen();
    expect(screen.getAllByText('Sen')).toHaveLength(1);
  });

  it('kopyala: ham kod panoya, "Davet kodu kopyalandı." mesajı', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Kopyala' }));

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('AB7K9TQX');
    await waitFor(() => expect(toast()).toBe('Davet kodu kopyalandı.'));
  });

  it('paylaş: davet mesajıyla sistem paylaşım menüsü', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Paylaş' }));

    expect(shareSpy).toHaveBeenCalledWith({
      message: "Ev Hali'nde ortak alışveriş listemize katıl. Davet kodu: AB7K9TQX",
    });
  });

  it('kodu yenile onay ister, onaylanınca eski kodla yeniler', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Kodu Yenile' }));
    expect(screen.getByText('Kodu yenile?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Onayla' }));
    await waitFor(() =>
      expect(regenerateInviteCode).toHaveBeenCalledWith({ homeId: 'h1', oldCode: 'AB7K9TQX' }),
    );
    await waitFor(() => expect(toast()).toBe('Davet kodu yenilendi.'));
  });

  it('ev adını düzenler (kırpılmış ad kaydedilir)', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Ev adını düzenle' }));

    const field = screen.getByLabelText('Ev adı');
    expect(field).toHaveDisplayValue('Yeşilyurt Evi');
    await fireEvent.changeText(field, '  Yazlık  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => expect(renameHome).toHaveBeenCalledWith({ homeId: 'h1', name: 'Yazlık' }));
    await waitFor(() => expect(toast()).toBe('Ev adı güncellendi.'));
  });

  it('boş adla kaydet hiçbir şey yazmaz, pencere kapanır', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Ev adını düzenle' }));
    await fireEvent.changeText(screen.getByLabelText('Ev adı'), '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));

    await waitFor(() => expect(screen.queryByLabelText('Ev adı')).toBeNull());
    expect(renameHome).not.toHaveBeenCalled();
  });

  it('ev okunamazsa hata ve tekrar dene gösterir', async () => {
    const refetch = jest.fn();
    jest.mocked(useHome).mockReturnValue({ isPending: false, isError: true, refetch } as never);
    await renderScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(refetch).toHaveBeenCalled();
  });
});
