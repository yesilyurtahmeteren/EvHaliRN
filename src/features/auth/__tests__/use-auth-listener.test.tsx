import { onAuthStateChanged } from '@react-native-firebase/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useAuthListener } from '@/features/auth/hooks/use-auth-listener';
import { useSessionStore } from '@/features/auth/store';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';

type AuthCallback = (user: { uid: string; displayName: string | null } | null) => void;
let emit: AuthCallback = () => undefined;
const unsubscribe = jest.fn();

jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
}));

function setup() {
  const client = new QueryClient();
  client.setQueryData(['users', 'u1'], { homeId: 'h1' });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const user = (uid: string) => ({
  uid,
  displayName: 'Ayşe',
  email: 'a@example.com',
  photoURL: null,
});

beforeEach(() => {
  jest.mocked(onAuthStateChanged).mockImplementation(((_auth: unknown, cb: AuthCallback) => {
    emit = cb;
    return unsubscribe;
  }) as never);
});

afterEach(async () => {
  await act(async () =>
    useSessionStore.setState({ status: 'initializing', user: null, lastUser: null }),
  );
});

describe('useAuthListener', () => {
  it("Firebase oturumunu store'a yansıtır", async () => {
    const { wrapper } = setup();
    await renderHook(() => useAuthListener(), { wrapper });

    await act(async () => emit(user('u1')));
    expect(useSessionStore.getState()).toMatchObject({ status: 'signedIn', user: { uid: 'u1' } });
  });

  it('çıkışta önbelleği temizler ve yazı boyutunu sıfırlar', async () => {
    const { client, wrapper } = setup();
    await renderHook(() => useAuthListener(), { wrapper });
    await act(async () => emit(user('u1')));
    useTextScaleStore.getState().setMultiplier(1.3);

    await act(async () => emit(null));
    expect(useSessionStore.getState().status).toBe('signedOut');
    expect(client.getQueryData(['users', 'u1'])).toBeUndefined();
    expect(useTextScaleStore.getState().multiplier).toBe(1);
  });

  it('başka bir kullanıcıya geçişte önceki kullanıcının verisini atar', async () => {
    const { client, wrapper } = setup();
    await renderHook(() => useAuthListener(), { wrapper });
    await act(async () => emit(user('u1')));

    await act(async () => emit(user('u2')));
    expect(client.getQueryData(['users', 'u1'])).toBeUndefined();
    expect(useSessionStore.getState().user?.uid).toBe('u2');
  });

  it('bileşen kalkınca dinleyiciyi kapatır', async () => {
    const { wrapper } = setup();
    const { unmount } = await renderHook(() => useAuthListener(), { wrapper });
    await unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
