import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { router } from 'expo-router';

import '@/shared/i18n';
import { useSessionStore } from '@/features/auth/store';
import { addItem, cleanupOldBoughtItems, markNeeded } from '@/features/shopping-list/api';
import { ListScreen } from '@/features/shopping-list/components/list-screen';
import {
  useCatalogCategories,
  useFrozenTopCatalog,
} from '@/features/shopping-list/hooks/use-list-data';
import { hideToast } from '@/shared/components/toast/toast-store';
import { HomeIdProvider } from '@/shared/hooks/home-id';
import { useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import type { Item, ItemCategory } from '@/shared/schemas';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/shopping-list/api', () => ({
  addItem: jest.fn(() => Promise.resolve()),
  markBought: jest.fn(() => Promise.resolve()),
  markNeeded: jest.fn(() => Promise.resolve()),
  cleanupOldBoughtItems: jest.fn(() => Promise.resolve(0)),
}));
jest.mock('@/features/shopping-list/hooks/use-list-data', () => ({
  useCatalogCategories: jest.fn(),
  useFrozenTopCatalog: jest.fn(),
}));
jest.mock('@/shared/hooks/use-home', () => ({ useMembers: jest.fn() }));
jest.mock('@/shared/hooks/use-items', () => ({
  useNeededItems: jest.fn(),
  useBoughtItems: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

const item = (id: string, name: string, extra: Partial<Item> = {}): Item => ({
  id,
  name,
  status: 'needed',
  addedBy: 'u1',
  addedAt: new Date(),
  boughtBy: null,
  boughtAt: null,
  quantity: 1,
  note: null,
  unit: 'adet',
  urgent: false,
  ...extra,
});

function setData({
  needed = [] as Item[],
  bought = [] as Item[],
  fromCache = false,
  categories = new Map<string, ItemCategory | null>(),
  top = [] as { id: string; name: string; count: number; category: null }[],
} = {}) {
  jest.mocked(useNeededItems).mockReturnValue({
    isPending: false,
    isError: false,
    data: { items: needed, fromCache },
  } as never);
  jest.mocked(useBoughtItems).mockReturnValue({ data: { items: bought, fromCache } } as never);
  jest.mocked(useMembers).mockReturnValue({
    data: [
      { uid: 'u1', displayName: 'Ayşe', photoUrl: null },
      { uid: 'u2', displayName: 'Mehmet', photoUrl: null },
    ],
  } as never);
  jest.mocked(useCatalogCategories).mockReturnValue({ data: categories } as never);
  jest.mocked(useFrozenTopCatalog).mockReturnValue({ data: top } as never);
}

async function renderScreen() {
  useSessionStore
    .getState()
    .setUser({ uid: 'u1', displayName: 'Ayşe', email: null, photoURL: null });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <HomeIdProvider homeId="h1">
        <ListScreen />
      </HomeIdProvider>
    </QueryClientProvider>,
  );
  // FlashList ilk çizimden sonra ölçüp kendini bir kez daha günceller.
  await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
}

afterEach(async () => {
  await act(async () => hideToast());
  jest.clearAllMocks();
});

const categories = new Map<string, ItemCategory | null>([
  ['süt', 'dairy_breakfast'],
  ['elma', 'fruit_vegetable'],
]);

describe('ListScreen', () => {
  it('açılışta 7 günlük temizliği bir kez tetikler', async () => {
    setData();
    await renderScreen();
    expect(cleanupOldBoughtItems).toHaveBeenCalledWith('h1');
  });

  it('boş listede "Evde eksik bir şey yok"', async () => {
    setData();
    await renderScreen();
    expect(screen.getByText('Evde eksik bir şey yok')).toBeOnTheScreen();
  });

  it('kategori başlıkları markette yürüme sırasıyla, sayılarıyla', async () => {
    setData({ needed: [item('1', 'Süt'), item('2', 'Elma'), item('3', 'Pil')], categories });
    await renderScreen();

    const headers = screen
      .getAllByRole('header')
      .map((node) => within(node).queryAllByText(/·/)[0]?.props.children ?? node.props.children);
    expect(headers).toEqual(['Meyve & Sebze · 1', 'Süt & Kahvaltı · 1', 'Diğer · 1']);
  });

  it('birden fazla grup varsa filtre çipleri; seçilen kategoriye göre süzer', async () => {
    setData({ needed: [item('1', 'Süt'), item('2', 'Elma')], categories });
    await renderScreen();

    expect(screen.getByRole('radio', { name: 'Tümü (2)' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Süt & Kahvaltı' }));

    expect(screen.getByText('Süt')).toBeOnTheScreen();
    expect(screen.queryByText('Elma')).toBeNull();
  });

  it('tek grupta filtre satırı yok', async () => {
    setData({ needed: [item('1', 'Süt')], categories });
    await renderScreen();
    expect(screen.queryByRole('radio', { name: /Tümü/ })).toBeNull();
  });

  it('satırda ekleyen, acil ve miktar rozeti görünür', async () => {
    setData({ needed: [item('1', 'Süt', { urgent: true, quantity: 2, unit: 'litre' })] });
    await renderScreen();

    expect(screen.getByText('Ekleyen: Ayşe')).toBeOnTheScreen();
    expect(screen.getByText('Acil')).toBeOnTheScreen();
    expect(screen.getByText('2 Litre')).toBeOnTheScreen();
  });

  it('kutuya dokununca "X alındı" ve "Geri al"', async () => {
    setData({ needed: [item('1', 'Süt')] });
    await renderScreen();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Süt alındı olarak işaretle' }));
    expect(screen.getByRole('checkbox', { name: 'Süt alındı olarak işaretle' })).toBeChecked();
  });

  it('satır gövdesi ürünü düzenlemeye açar', async () => {
    setData({ needed: [item('i1', 'Süt')] });
    await renderScreen();

    await fireEvent.press(screen.getByText('Süt'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/item-form', params: { itemId: 'i1' } });
  });

  it('Alınanlar bölümü kapalı başlar, açılınca "Alan" ile listelenir, kutu geri koyar', async () => {
    setData({
      needed: [item('1', 'Süt')],
      bought: [item('b1', 'Ekmek', { status: 'bought', boughtBy: 'u2', boughtAt: new Date() })],
    });
    await renderScreen();

    const header = screen.getByRole('button', { name: 'Alınanlar (1)' });
    expect(screen.queryByText('Ekmek')).toBeNull();
    await fireEvent.press(header);

    expect(screen.getByText('Alan: Mehmet')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Ekmek alındı olarak işaretle' }));
    expect(markNeeded).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'b1' });
  });

  it('önbellekten geliyorsa çevrimdışı şeridi', async () => {
    setData({ fromCache: true });
    await renderScreen();
    expect(
      screen.getByText('Çevrimdışısın, değişiklikler bağlanınca gönderilecek.'),
    ).toBeOnTheScreen();
  });

  it('hızlı ekleme: Enter ekler, alanı temizler; boş metin eklemez', async () => {
    setData();
    await renderScreen();
    const field = screen.getByLabelText('Ne eksik?');

    await fireEvent.changeText(field, '  Süt ');
    await fireEvent(field, 'submitEditing');
    await waitFor(() =>
      expect(addItem).toHaveBeenCalledWith({ homeId: 'h1', uid: 'u1', name: 'Süt' }),
    );
    expect(field).toHaveDisplayValue('');

    await fireEvent.changeText(field, '   ');
    await fireEvent.press(screen.getByRole('button', { name: 'Ekle' }));
    expect(addItem).toHaveBeenCalledTimes(1);
  });

  it('"Detaylı ekle" alandaki yazıyla formu açar', async () => {
    setData();
    await renderScreen();
    await fireEvent.changeText(screen.getByLabelText('Ne eksik?'), 'Peynir');
    await fireEvent.press(screen.getByRole('button', { name: 'Detaylı ekle' }));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/item-form',
      params: { initialName: 'Peynir' },
    });
  });

  it('sık alınanlar: listede olan çip devre dışı, diğeri tek dokunuşla ekler', async () => {
    setData({
      needed: [item('1', 'Süt')],
      top: [
        { id: 'süt', name: 'Süt', count: 9, category: null },
        { id: 'ekmek', name: 'Ekmek', count: 5, category: null },
      ],
    });
    await renderScreen();

    expect(screen.getByRole('button', { name: 'Süt' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Ekmek' }));
    await waitFor(() =>
      expect(addItem).toHaveBeenCalledWith({ homeId: 'h1', uid: 'u1', name: 'Ekmek' }),
    );
  });
});
