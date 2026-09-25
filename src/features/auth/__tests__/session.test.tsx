import { act, renderHook } from '@testing-library/react-native';

import { useRequiredUser, useSessionStore } from '@/features/auth/store';

const ayse = { uid: 'u1', displayName: 'Ayşe', email: 'a@example.com', photoURL: null };

afterEach(async () => {
  await act(async () =>
    useSessionStore.setState({ status: 'initializing', user: null, lastUser: null }),
  );
});

describe('session store', () => {
  it('başlangıçta initializing (açılış ekranı bu sürede kapanmaz)', async () => {
    expect(useSessionStore.getState().status).toBe('initializing');
  });

  it('kullanıcıya göre signedIn / signedOut', async () => {
    useSessionStore.getState().setUser(ayse);
    expect(useSessionStore.getState().status).toBe('signedIn');

    useSessionStore.getState().setUser(null);
    expect(useSessionStore.getState()).toMatchObject({ status: 'signedOut', user: null });
  });
});

describe('useRequiredUser', () => {
  it('oturum açık kullanıcıyı döner', async () => {
    await act(async () => useSessionStore.getState().setUser(ayse));
    const { result } = await renderHook(() => useRequiredUser());
    expect(result.current.uid).toBe('u1');
  });

  it("çıkış anındaki son render'da çökmez, son kullanıcıyı döner", async () => {
    await act(async () => useSessionStore.getState().setUser(ayse));
    const { result } = await renderHook(() => useRequiredUser());

    await act(async () => useSessionStore.getState().setUser(null));
    expect(result.current.uid).toBe('u1');
  });

  it('hiç oturum yokken hata fırlatır', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(renderHook(() => useRequiredUser())).rejects.toThrow();
  });
});
