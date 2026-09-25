import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';

import { useSessionStore } from '@/features/auth/store';
import { useShellUi } from '@/features/shell/ui-store';
import { markBought, markNeeded } from '@/features/shopping-list/api';
import { ListScreen } from '@/features/shopping-list/components/list-screen';
import { useCatalogCategories } from '@/features/shopping-list/hooks/use-list-data';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import type { Item, ItemCategory } from '@/shared/schemas';
import { renderWithTheme, sleep } from '@/test-utils/render';

jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    ...jest.requireActual('expo-router'),
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
  };
});
jest.mock('@/features/shopping-list/api', () => ({
  markBought: jest.fn(() => Promise.resolve()),
  markNeeded: jest.fn(() => Promise.resolve()),
  cleanupOldBoughtItems: jest.fn(() => Promise.resolve(0)),
}));
jest.mock('@/features/shopping-list/hooks/use-list-data', () => ({
  useCatalogCategories: jest.fn(),
}));
jest.mock('@/shared/hooks/use-home', () => ({ useHome: jest.fn(), useMembers: jest.fn() }));
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
  categories = new Map<string, ItemCategory | null>(),
  roles = null as Record<string, string> | null,
} = {}) {
  jest.mocked(useNeededItems).mockReturnValue({
    isPending: false,
    isError: false,
    data: { items: needed, fromCache: false },
  } as never);
  jest
    .mocked(useBoughtItems)
    .mockReturnValue({ data: { items: bought, fromCache: false } } as never);
  jest.mocked(useHome).mockReturnValue({
    data: { id: 'h1', name: 'Ev', memberIds: ['u1', 'u2'], inviteCode: 'X', roles },
  } as never);
  jest.mocked(useMembers).mockReturnValue({
    data: [
      { uid: 'u1', displayName: 'Ayşe Yılmaz', photoUrl: null },
      { uid: 'u2', displayName: 'Mehmet', photoUrl: null },
    ],
  } as never);
  jest.mocked(useCatalogCategories).mockReturnValue({ data: categories } as never);
}

async function renderScreen() {
  useSessionStore
    .getState()
    .setUser({ uid: 'u2', displayName: 'Mehmet', email: null, photoURL: null });
  await renderWithTheme(<ListScreen />, { homeId: 'h1' });
}

afterEach(async () => {
  await act(async () => sleep(0));
  jest.clearAllMocks();
});

describe('ListScreen', () => {
  it('ilerleme kartı, bölüm başlıkları ve satır alt yazısı', async () => {
    setData({
      needed: [
        item('1', 'Süt', { quantity: 2, unit: 'litre' }),
        item('2', 'Deterjan', { urgent: true }),
        item('3', 'Pil'),
      ],
      bought: [item('4', 'Ekmek', { status: 'bought' })],
      categories: new Map([
        ['süt', 'food'],
        ['deterjan', 'clean'],
      ]),
    });
    await renderScreen();

    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('1 / 4 alındı')).toBeOnTheScreen();
    expect(
      screen.getByRole('progressbar', { name: 'Alışveriş ilerlemesi' }),
    ).toHaveAccessibilityValue({ now: 25 });
    expect(screen.getAllByRole('header').map((h) => h.props.children)).toEqual([
      'Gıda',
      'Temizlik',
      'Diğer',
    ]);
    expect(screen.getByText('2 litre · Ayşe ekledi')).toBeOnTheScreen();
    expect(screen.getByText('Acil')).toBeOnTheScreen();
  });

  it('"İhtiyaç Ekle" alt sayfayı açar', async () => {
    setData({ needed: [item('1', 'Süt')] });
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'İhtiyaç Ekle' }));
    expect(useShellUi.getState().sheet).toEqual({ kind: 'item', itemId: null });
    await act(async () => useShellUi.getState().sheetClosed());
  });

  it('onay kutusu: 600 ms sonra alındı olarak yazılır', async () => {
    setData({ needed: [item('1', 'Süt')] });
    await renderScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Süt: aldım olarak işaretle' }));
    expect(markBought).not.toHaveBeenCalled();
    await waitFor(
      () => expect(markBought).toHaveBeenCalledWith({ homeId: 'h1', itemId: '1', uid: 'u2' }),
      {
        timeout: 1500,
      },
    );
  });

  it('Alınanlar: Göster ile açılır, "Geri al" ürünü listeye döndürür', async () => {
    setData({ needed: [item('1', 'Süt')], bought: [item('2', 'Ekmek', { status: 'bought' })] });
    await renderScreen();

    const header = screen.getByRole('button', { name: 'Alınanlar, 1' });
    expect(within(header).getByText('Göster')).toBeOnTheScreen();
    await fireEvent.press(header);
    await fireEvent.press(screen.getByRole('button', { name: 'Ekmek listeye geri al' }));
    expect(markNeeded).toHaveBeenCalledWith({ homeId: 'h1', itemId: '2' });
  });

  it('bekleyen ürün yoksa boş durum', async () => {
    setData({ bought: [item('2', 'Ekmek', { status: 'bought' })] });
    await renderScreen();
    expect(screen.getByText('Hepsi alındı!')).toBeOnTheScreen();
    expect(screen.getByText('Harika! Listedeki her şey alındı.')).toBeOnTheScreen();
  });

  it('misafir yalnızca görüntüler: ekleme düğmesi yok, onay kutusu kapalı', async () => {
    setData({ needed: [item('1', 'Süt')], roles: { u1: 'admin', u2: 'guest' } });
    await renderScreen();
    expect(screen.queryByRole('button', { name: 'İhtiyaç Ekle' })).toBeNull();
    expect(
      screen.getByText('Misafir olarak listeyi yalnızca görüntüleyebilirsiniz.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('checkbox', { name: 'Süt: aldım olarak işaretle' })).toBeDisabled();
  });
});
