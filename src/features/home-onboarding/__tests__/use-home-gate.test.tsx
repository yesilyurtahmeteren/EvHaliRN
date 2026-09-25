import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useSessionStore } from '@/features/auth/store';
import { useHomeGate } from '@/features/home-onboarding/hooks/use-home-gate';
import { subscribeDoc } from '@/shared/lib/firebase/subscribe';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
}));

// subscribeDoc'un yerine elle sürülen bir kaynak: parse fonksiyonu gerçek
// şema, yalnızca onSnapshot sahte.
type Emit = { data: (data: Record<string, unknown> | null) => void; fail: (e: Error) => void };
let source: Emit;
let subscriptions = 0;
jest.mock('@/shared/lib/firebase/subscribe', () => ({
  subscribeDoc: jest.fn(),
}));

beforeEach(() => {
  subscriptions = 0;
  jest.mocked(subscribeDoc).mockImplementation(((
      _ref: unknown,
      parse: (id: string, data: Record<string, unknown>) => unknown,
    ) =>
    (onNext: (v: unknown) => void, onError: (e: Error) => void) => {
      subscriptions += 1;
      source = {
        data: (data) => onNext(data === null ? null : parse('u1', data)),
        fail: onError,
      };
      return () => undefined;
    }) as never);
  useSessionStore.getState().setUser({ uid: 'u1', displayName: null, email: null, photoURL: null });
});

afterEach(async () => {
  await act(async () => {
    useSessionStore.setState({ status: 'initializing', user: null, lastUser: null });
    useTextScaleStore.getState().setMultiplier(1);
  });
});

async function setup() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = await renderHook(() => useHomeGate(), { wrapper });
  await waitFor(() => expect(subscriptions).toBe(1));
  return hook;
}

describe('useHomeGate', () => {
  it('ilk snapshot gelene kadar loading', async () => {
    const { result } = await setup();
    expect(result.current.status).toBe('loading');
  });

  it('homeId varsa ready + homeId', async () => {
    const { result } = await setup();
    await act(async () => source.data({ displayName: 'Ayşe', homeId: 'h1' }));
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', homeId: 'h1' }));
  });

  it('homeId null ya da doküman yoksa ready + null (Ev Oluştur)', async () => {
    const { result } = await setup();
    await act(async () => source.data({ displayName: 'Ayşe', homeId: null }));
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', homeId: null }));

    await act(async () => source.data(null));
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', homeId: null }));
  });

  it('okuma hatası "ev yok" DEĞİL, error durumu; tekrar dene yeniden abone olur', async () => {
    const { result } = await setup();
    await act(async () =>
      source.fail(Object.assign(new Error('x'), { code: 'permission-denied' })),
    );
    await waitFor(() => expect(result.current.status).toBe('error'));

    await act(async () => {
      if (result.current.status === 'error') {
        result.current.retry();
      }
    });
    await waitFor(() => expect(subscriptions).toBe(2));
    await act(async () => source.data({ homeId: 'h1' }));
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', homeId: 'h1' }));
  });

  it('kullanıcının yazı boyutunu uygular', async () => {
    await setup();
    await act(async () => source.data({ homeId: 'h1', textScale: 1.15 }));
    await waitFor(() => expect(useTextScaleStore.getState().multiplier).toBe(1.15));
  });
});
