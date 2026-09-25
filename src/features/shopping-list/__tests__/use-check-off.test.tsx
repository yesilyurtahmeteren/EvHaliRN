import { act, renderHook, waitFor } from '@testing-library/react-native';

import '@/shared/i18n';
import { useSessionStore } from '@/features/auth/store';
import { markBought, markNeeded } from '@/features/shopping-list/api';
import { useCheckOff } from '@/features/shopping-list/hooks/use-check-off';
import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';
import type { Item } from '@/shared/schemas';

jest.mock('@/features/shopping-list/api', () => ({
  markBought: jest.fn(() => Promise.resolve()),
  markNeeded: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

const milk: Item = {
  id: 'i1',
  name: 'Süt',
  status: 'needed',
  addedBy: 'u1',
  addedAt: new Date(),
  boughtBy: null,
  boughtAt: null,
  quantity: 1,
  note: null,
  unit: 'adet',
  urgent: false,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  useSessionStore.getState().setUser({ uid: 'u2', displayName: null, email: null, photoURL: null });
});

afterEach(async () => {
  await act(async () => hideToast());
  jest.clearAllMocks();
});

describe('useCheckOff', () => {
  it('işaretle: hemen dolu, 250 ms sonra solar, 200 ms sonra listeden çıkar', async () => {
    const { result } = await renderHook(() => useCheckOff('h1'));

    await act(async () => result.current.toggle(milk));
    expect(markBought).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'i1', uid: 'u2' });
    expect(result.current.leaving.has('i1')).toBe(true);
    expect(result.current.fading.has('i1')).toBe(false);
    expect(useToastStore.getState().current?.message).toBe('Süt alındı');

    await waitFor(() => expect(result.current.fading.has('i1')).toBe(true));
    await waitFor(() => expect(result.current.leaving.has('i1')).toBe(false));
    expect(result.current.fading.has('i1')).toBe(false);
  });

  it('pencere içinde tekrar dokunmak geri alır, zamanlayıcı iptal olur', async () => {
    const { result } = await renderHook(() => useCheckOff('h1'));

    await act(async () => result.current.toggle(milk));
    await act(async () => result.current.toggle(milk));

    expect(markNeeded).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'i1' });
    expect(result.current.leaving.has('i1')).toBe(false);
    await act(async () => sleep(500));
    expect(result.current.fading.has('i1')).toBe(false);
  });

  it('toast\'taki "Geri al" ürünü listeye geri koyar', async () => {
    const { result } = await renderHook(() => useCheckOff('h1'));
    await act(async () => result.current.toggle(milk));

    const action = useToastStore.getState().current?.action;
    expect(action?.label).toBe('Geri al');
    await act(async () => action?.onPress());

    expect(markNeeded).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'i1' });
    expect(result.current.leaving.has('i1')).toBe(false);
  });

  it('yazma başarısızsa satır geri gelir ve hata gösterilir', async () => {
    jest.mocked(markBought).mockRejectedValueOnce({ code: 'firestore/permission-denied' });
    const { result } = await renderHook(() => useCheckOff('h1'));

    await act(async () => result.current.toggle(milk));

    await waitFor(() => expect(result.current.leaving.has('i1')).toBe(false));
    expect(useToastStore.getState().current?.message).toBe(
      'Bu işlem için yetkin yok görünüyor, tekrar giriş yapmayı dene.',
    );
  });

  it('restore (Alınanlar bölümü) ürünü doğrudan listeye geri koyar', async () => {
    const { result } = await renderHook(() => useCheckOff('h1'));
    await act(async () => result.current.restore({ ...milk, status: 'bought' }));
    expect(markNeeded).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'i1' });
    expect(markBought).not.toHaveBeenCalled();
  });
});
