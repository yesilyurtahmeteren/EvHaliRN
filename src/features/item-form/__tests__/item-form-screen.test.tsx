import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/shared/i18n';
import { useSessionStore } from '@/features/auth/store';
import { ItemFormScreen } from '@/features/item-form/components/item-form-screen';
import {
  useCatalogCategories,
  useFrozenTopCatalog,
} from '@/features/shopping-list/hooks/use-list-data';
import { HomeIdProvider } from '@/shared/hooks/home-id';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';

jest.mock('expo-router', () => ({
  router: { back: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/features/shopping-list/hooks/use-list-data', () => ({
  useCatalogCategories: jest.fn(),
  useFrozenTopCatalog: jest.fn(),
}));
jest.mock('@/shared/hooks/use-home', () => ({ useHome: jest.fn(), useMembers: jest.fn() }));
jest.mock('@/shared/hooks/use-items', () => ({
  useNeededItems: jest.fn(),
  useBoughtItems: jest.fn(),
}));
jest.mock('@/features/item-form/hooks/use-save-item', () => ({
  useSaveItem: () => ({ isPending: false, run: jest.fn(() => Promise.resolve(true)) }),
}));

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useNeededItems).mockReturnValue({
    isPending: false,
    data: {
      items: [
        {
          id: 'i1',
          name: 'Süt',
          status: 'needed',
          addedBy: 'u1',
          addedAt: new Date(),
          boughtBy: null,
          boughtAt: null,
          quantity: 2,
          note: 'Pınar',
          unit: 'litre',
          urgent: true,
        },
      ],
      fromCache: false,
    },
  } as never);
  jest.mocked(useBoughtItems).mockReturnValue({ isPending: false, data: { items: [] } } as never);
  jest.mocked(useHome).mockReturnValue({ data: { name: 'Yeşilyurt Evi' } } as never);
  jest.mocked(useMembers).mockReturnValue({
    data: [
      { uid: 'u1', displayName: 'Ayşe' },
      { uid: 'u2', displayName: 'Mehmet' },
    ],
  } as never);
  jest.mocked(useCatalogCategories).mockReturnValue({
    isPending: false,
    data: new Map([['süt', 'dairy_breakfast']]),
  } as never);
  jest.mocked(useFrozenTopCatalog).mockReturnValue({ data: [] } as never);
});

async function renderScreen(params: Record<string, string>) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  useSessionStore
    .getState()
    .setUser({ uid: 'u1', displayName: 'Ayşe', email: null, photoURL: null });
  await render(
    <SafeAreaProvider initialMetrics={metrics}>
      <QueryClientProvider client={new QueryClient()}>
        <HomeIdProvider homeId="h1">
          <ItemFormScreen />
        </HomeIdProvider>
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
}

describe('ItemFormScreen', () => {
  it('düzenleme: ürünü canlı listeden bulur, alanları ve kategoriyi doldurur', async () => {
    await renderScreen({ itemId: 'i1' });

    expect(screen.getByRole('header', { name: 'Ürünü Düzenle' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Ürün adı')).toHaveDisplayValue('Süt');
    expect(screen.getByLabelText('Marka / not (isteğe bağlı)')).toHaveDisplayValue('Pınar');
    expect(screen.getByRole('radio', { name: 'Litre' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Süt & Kahvaltı' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Acil İhtiyaç' })).toBeChecked();
  });

  it('ekleme: hızlı ekleme alanındaki yazıyla açılır, kendini senkron listesine koymaz', async () => {
    await renderScreen({ initialName: 'Süt' });

    expect(screen.getByLabelText('Ürün adı')).toHaveDisplayValue('Süt');
    expect(screen.getByRole('radio', { name: 'Süt & Kahvaltı' })).toBeChecked();
    expect(screen.getByText('Mehmet ile anında senkronize olur.')).toBeOnTheScreen();
  });

  it('ürün artık yoksa bunu söyler ve kapatılabilir', async () => {
    await renderScreen({ itemId: 'silinmis' });

    expect(screen.getByText('Bu ürün artık listede yok.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(router.back).toHaveBeenCalled();
  });
});
