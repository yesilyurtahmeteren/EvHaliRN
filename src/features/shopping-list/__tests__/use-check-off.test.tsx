import { act, renderHook, waitFor } from '@testing-library/react-native';

import '@/shared/i18n';
import { useSessionStore } from '@/features/auth/store';
import { useShellUi } from '@/features/shell/ui-store';
import { markBought, markNeeded } from '@/features/shopping-list/api';
import { useCheckOff } from '@/features/shopping-list/hooks/use-check-off';
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

afterEach(() => jest.clearAllMocks());

// HANDOFF §2.2: dokununca işaretlenir, 600 ms sonra "Alınanlar"a taşınır
// (yazma o an), sayaç zıplar. Bu pencerede tekrar dokunmak iptal eder.
describe('useCheckOff', () => {
  it('işaretle: hemen "işaretleniyor", 600 ms sonra yazılır ve sayaç zıplar', async () => {
    const bumpBefore = useShellUi.getState().bumpKey;
    const { result } = await renderHook(() => useCheckOff('h1'));

    await act(async () => result.current.toggle(milk));
    expect(result.current.checking.has('i1')).toBe(true);
    expect(markBought).not.toHaveBeenCalled();

    await waitFor(
      () => expect(markBought).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'i1', uid: 'u2' }),
      {
        timeout: 1500,
      },
    );
    expect(result.current.checking.has('i1')).toBe(false);
    expect(useShellUi.getState().bumpKey).toBeGreaterThan(bumpBefore);
  });

  it('600 ms içinde tekrar dokunmak iptal eder, hiçbir şey yazılmaz', async () => {
    const { result } = await renderHook(() => useCheckOff('h1'));

    await act(async () => result.current.toggle(milk));
    await act(async () => result.current.toggle(milk));
    expect(result.current.checking.has('i1')).toBe(false);

    await act(async () => sleep(750));
    expect(markBought).not.toHaveBeenCalled();
  });

  it('ekrandan çıkılırsa bekleyen işaret hemen yazılır', async () => {
    const { result, unmount } = await renderHook(() => useCheckOff('h1'));
    await act(async () => result.current.toggle(milk));
    await unmount();
    expect(markBought).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'i1', uid: 'u2' });
  });

  it('geri al: listeye döner, vurgulanır ve bölümün başına alınır', async () => {
    const { result } = await renderHook(() => useCheckOff('h1'));
    await act(async () => result.current.restore(milk));

    expect(markNeeded).toHaveBeenCalledWith({ homeId: 'h1', itemId: 'i1' });
    expect(useShellUi.getState().flash?.id).toBe('i1');
    expect(result.current.restoredAt.has('i1')).toBe(true);
  });
});
