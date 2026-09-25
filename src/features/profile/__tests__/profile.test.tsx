import { updateDoc } from '@react-native-firebase/firestore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import '@/shared/i18n';
import { useSessionStore } from '@/features/auth/store';
import * as profileApi from '@/features/profile/api';
import { ProfileScreen } from '@/features/profile/components/profile-screen';
import { useUserDoc } from '@/shared/hooks/use-user-doc';
import { hideToast, useToastStore } from '@/shared/components/toast/toast-store';
import type { AppUser } from '@/shared/schemas';
import { useThemeStore } from '@/shared/theme/theme-store';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, ...path: string[]) => ({ path: path.join('/') })),
  updateDoc: jest.fn(() => Promise.resolve()),
  arrayRemove: jest.fn((...values: unknown[]) => ({ arrayRemove: values })),
}));
jest.mock('@/features/auth/api', () => ({ signInWithGoogle: jest.fn(), signOut: jest.fn() }));
jest.mock('@/shared/hooks/use-user-doc', () => ({ useUserDoc: jest.fn() }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

const appUser: AppUser = {
  uid: 'u1',
  displayName: 'Ayşe',
  photoUrl: null,
  homeId: 'h1',
  notificationsEnabled: true,
  textScale: 1,
};

function mockUserDoc(overrides: Partial<AppUser> = {}) {
  jest.mocked(useUserDoc).mockReturnValue({ data: { ...appUser, ...overrides } } as never);
}

async function renderScreen() {
  useSessionStore.getState().setUser({
    uid: 'u1',
    displayName: 'Ayşe Yılmaz',
    email: 'ayse@example.com',
    photoURL: null,
  });
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <ProfileScreen />
    </QueryClientProvider>,
  );
}

const writes = () =>
  jest.mocked(updateDoc).mock.calls.map(([ref, data]) => [(ref as { path: string }).path, data]);

beforeEach(() => mockUserDoc());

afterEach(async () => {
  await act(async () => {
    hideToast();
    useThemeStore.getState().setMode('system');
  });
  jest.clearAllMocks();
});

describe('profile api', () => {
  it('evden ayrılma: önce üyelikten çıkar, sonra homeId temizlenir', async () => {
    await profileApi.leaveHome({ homeId: 'h1', uid: 'u1' });
    expect(writes()).toEqual([
      ['homes/h1', { memberIds: { arrayRemove: ['u1'] } }],
      ['users/u1', { homeId: null }],
    ]);
  });
});

describe('ProfileScreen', () => {
  it('Google hesabının adını ve e-postasını gösterir', async () => {
    await renderScreen();
    expect(screen.getByText('Ayşe Yılmaz')).toBeOnTheScreen();
    expect(screen.getByText('ayse@example.com')).toBeOnTheScreen();
  });

  it('karanlık mod anahtarı oturum içi tema tercihini değiştirir', async () => {
    await renderScreen();
    const toggle = screen.getByRole('switch', { name: 'Karanlık Mod' });
    expect(toggle).not.toBeChecked();

    await fireEvent.press(toggle);
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('bildirim tercihini users/{uid} dokümanına yazar', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('switch', { name: 'Yeni ürün eklendiğinde bildir' }));
    await waitFor(() => expect(writes()).toEqual([['users/u1', { notificationsEnabled: false }]]));
  });

  it('yazı boyutu çiplerinde seçili olan işaretli, dokununca kaydedilir', async () => {
    mockUserDoc({ textScale: 1.15 });
    await renderScreen();

    expect(screen.getByRole('radio', { name: 'Büyük' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Normal' })).not.toBeChecked();

    await fireEvent.press(screen.getByRole('radio', { name: 'Çok büyük' }));
    await waitFor(() => expect(writes()).toEqual([['users/u1', { textScale: 1.3 }]]));
  });

  it('evden ayrılma onay ister; vazgeçince hiçbir şey yazılmaz', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Evden Ayrıl' }));
    expect(screen.getByText('Evden ayrıl?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(writes()).toEqual([]);
  });

  it('onaylanınca evden ayrılır', async () => {
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Evden Ayrıl' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Onayla' }));

    await waitFor(() =>
      expect(writes()).toEqual([
        ['homes/h1', { memberIds: { arrayRemove: ['u1'] } }],
        ['users/u1', { homeId: null }],
      ]),
    );
  });

  it('ayrılma başarısızsa hata mesajı gösterir', async () => {
    jest.mocked(updateDoc).mockRejectedValueOnce(new Error('unavailable'));
    await renderScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Evden Ayrıl' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Onayla' }));

    await waitFor(() =>
      expect(useToastStore.getState().current?.message).toBe('Evden ayrılamadın, tekrar deneyin.'),
    );
  });

  it('evi yoksa "Evden Ayrıl" görünmez', async () => {
    mockUserDoc({ homeId: null });
    await renderScreen();
    expect(screen.queryByRole('button', { name: 'Evden Ayrıl' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Çıkış Yap' })).toBeOnTheScreen();
  });
});
