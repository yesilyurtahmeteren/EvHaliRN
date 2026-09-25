import { setDoc, updateDoc } from '@react-native-firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useSessionStore } from '@/features/auth/store';
import { useSaveItem } from '@/features/item-form/hooks/use-save-item';
import { addItem } from '@/features/shopping-list/api';
import type { ItemFormValues } from '@/features/item-form/schemas';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, ...path: string[]) => ({ path: path.join('/') })),
  updateDoc: jest.fn(() => Promise.resolve()),
  setDoc: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/features/shopping-list/api', () => ({ addItem: jest.fn(() => Promise.resolve()) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

const values: ItemFormValues = {
  name: 'Süt',
  quantity: 2,
  unit: 'litre',
  note: null,
  category: null,
  urgent: true,
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  useSessionStore.getState().setUser({ uid: 'u1', displayName: null, email: null, photoURL: null });
});

describe('useSaveItem', () => {
  it('düzenleme: yalnızca içerik alanları, ardından katalog kategorisi (merge)', async () => {
    const { result } = await renderHook(() => useSaveItem('h1', 'i1'), { wrapper });
    await act(async () => {
      await result.current.run({ ...values, category: 'dairy_breakfast' });
    });

    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'homes/h1/items/i1' },
      { name: 'Süt', quantity: 2, note: null, unit: 'litre', urgent: true },
    );
    expect(setDoc).toHaveBeenCalledWith(
      { path: 'homes/h1/catalog/süt' },
      { category: 'dairy_breakfast' },
      { merge: true },
    );
    expect(addItem).not.toHaveBeenCalled();
  });

  it('ekleme: addItem; "Kategori yok" katalogdaki kategoriyi korur (Flutter ??)', async () => {
    const { result } = await renderHook(() => useSaveItem('h1', null), { wrapper });
    await act(async () => {
      await result.current.run(values);
    });

    expect(addItem).toHaveBeenCalledWith({
      homeId: 'h1',
      uid: 'u1',
      name: 'Süt',
      quantity: 2,
      note: null,
      unit: 'litre',
      urgent: true,
      category: undefined,
    });
    expect(updateDoc).not.toHaveBeenCalled();
  });
});
