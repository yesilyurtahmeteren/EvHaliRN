import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';

import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';
import { useFeedbackMutation } from '@/shared/lib/feedback';
import { errorCode, friendlyErrorKey } from '@/shared/lib/firebase/errors';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// TanStack durum bildirimlerini setTimeout(0) ile topluyor; act içinde
// boşaltılmazsa "not wrapped in act" uyarısı çıkar.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const toastMessage = () => useToastStore.getState().current?.message;

afterEach(async () => {
  hideToast();
  jest.clearAllMocks();
});

describe('errors', () => {
  it('RNFB önekli ve öneksiz kodları tanır', async () => {
    expect(errorCode({ code: 'firestore/permission-denied' })).toBe('permission-denied');
    expect(errorCode({ code: 'unavailable' })).toBe('unavailable');
    expect(errorCode(new Error('x'))).toBeUndefined();
    expect(friendlyErrorKey({ code: 'firestore/permission-denied' })).toBe(
      'errors.permissionDenied',
    );
    expect(friendlyErrorKey(new Error('x'))).toBe('errors.generic');
  });
});

describe('useFeedbackMutation', () => {
  it('başarıda true döner ve başarı mesajını gösterir', async () => {
    const { result } = await renderHook(
      () =>
        useFeedbackMutation({
          mutationFn: () => Promise.resolve(),
          successMessage: 'Ev adı güncellendi.',
        }),
      { wrapper },
    );

    let ok = false;
    await act(async () => {
      ok = await result.current.run();
      await settle();
    });
    expect(ok).toBe(true);
    expect(toastMessage()).toBe('Ev adı güncellendi.');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('izin hatasında false döner, titreşir ve anlaşılır mesaj gösterir', async () => {
    const { result } = await renderHook(
      () =>
        useFeedbackMutation({
          mutationFn: () => Promise.reject({ code: 'firestore/permission-denied' }),
        }),
      { wrapper },
    );

    let ok = true;
    await act(async () => {
      ok = await result.current.run();
      await settle();
    });
    expect(ok).toBe(false);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(toastMessage()).toBe('Bu işlem için yetkiniz yok görünüyor.');
  });

  it('özel hata mesajı genel mesajın yerine geçer', async () => {
    const { result } = await renderHook(
      () =>
        useFeedbackMutation({
          mutationFn: () => Promise.reject(new Error('network')),
          errorMessage: 'Ev oluşturulamadı, tekrar deneyin.',
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.run();
      await settle();
    });
    expect(toastMessage()).toBe('Ev oluşturulamadı, tekrar deneyin.');
  });
});
