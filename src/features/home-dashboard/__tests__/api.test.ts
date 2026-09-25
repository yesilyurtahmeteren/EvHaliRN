import { deleteDoc, getDoc, onSnapshot, setDoc, updateDoc } from '@react-native-firebase/firestore';

import { regenerateInviteCode, renameHome } from '@/features/home-dashboard/api';
import { subscribeMembers } from '@/shared/hooks/use-home';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, ...path: string[]) => ({ path: path.join('/') })),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}));
jest.mock('@/shared/lib/invite-code', () => ({
  ...jest.requireActual('@/shared/lib/invite-code'),
  generateInviteCode: () => 'NEWC0DE2',
}));

beforeEach(() => jest.clearAllMocks());

// Çağrıları sırasıyla [işlem, yol, veri] olarak toplar.
function writes() {
  const calls = [
    ...jest.mocked(setDoc).mock.calls.map((c, i) => ({
      order: jest.mocked(setDoc).mock.invocationCallOrder[i],
      entry: ['set', (c[0] as { path: string }).path, c[1]],
    })),
    ...jest.mocked(updateDoc).mock.calls.map((c, i) => ({
      order: jest.mocked(updateDoc).mock.invocationCallOrder[i],
      entry: ['update', (c[0] as { path: string }).path, c[1]],
    })),
    ...jest.mocked(deleteDoc).mock.calls.map((c, i) => ({
      order: jest.mocked(deleteDoc).mock.invocationCallOrder[i],
      entry: ['delete', (c[0] as { path: string }).path],
    })),
  ];
  return calls.sort((a, b) => a.order - b.order).map((c) => c.entry);
}

describe('renameHome', () => {
  it('yalnızca name alanını günceller (kural changedKeys: name)', async () => {
    await renameHome({ homeId: 'h1', name: 'Yeni Ad' });
    expect(writes()).toEqual([['update', 'homes/h1', { name: 'Yeni Ad' }]]);
  });
});

describe('regenerateInviteCode', () => {
  it('yeni davet -> evdeki kod -> eski daveti sil (Flutter sırası)', async () => {
    await expect(regenerateInviteCode({ homeId: 'h1', oldCode: 'AB7K9TQX' })).resolves.toBe(
      'NEWC0DE2',
    );
    expect(writes()).toEqual([
      ['set', 'invites/NEWC0DE2', { homeId: 'h1', createdAt: 'SERVER_TIMESTAMP' }],
      ['update', 'homes/h1', { inviteCode: 'NEWC0DE2' }],
      ['delete', 'invites/AB7K9TQX'],
    ]);
  });

  it('eski kod yoksa (Faz 2/3 evleri) silme yapılmaz', async () => {
    await regenerateInviteCode({ homeId: 'h1', oldCode: '' });
    expect(deleteDoc).not.toHaveBeenCalled();
  });
});

describe('subscribeMembers', () => {
  type Snap = { data: () => Record<string, unknown> | undefined };
  let pushHome: (snap: Snap) => void = () => undefined;

  beforeEach(() => {
    jest.mocked(onSnapshot).mockImplementation(((_ref: unknown, next: (s: Snap) => void) => {
      pushHome = next;
      return () => undefined;
    }) as never);
  });

  const userSnap = (uid: string, name: string | null) => ({
    id: uid,
    exists: () => name !== null,
    data: () => ({ displayName: name }),
  });

  it('memberIds sırasıyla üyeleri döner, dokümanı olmayanı atlar', async () => {
    jest.mocked(getDoc).mockImplementation((async (ref: { path: string }) => {
      const uid = ref.path.split('/')[1];
      return userSnap(uid, { u1: 'Ayşe', u2: null, u3: 'Can' }[uid] ?? null);
    }) as never);
    const onNext = jest.fn();
    subscribeMembers('h1')(onNext, jest.fn());

    pushHome({ data: () => ({ memberIds: ['u3', 'u2', 'u1'] }) });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onNext.mock.calls[0][0].map((m: { uid: string }) => m.uid)).toEqual(['u3', 'u1']);
  });

  it('eski okuma yenisinden sonra biterse eski sonuç yok sayılır', async () => {
    let releaseSlow: () => void = () => undefined;
    jest.mocked(getDoc).mockImplementation(((ref: { path: string }) => {
      const uid = ref.path.split('/')[1];
      if (uid === 'slow') {
        return new Promise((resolve) => (releaseSlow = () => resolve(userSnap(uid, 'Eski'))));
      }
      return Promise.resolve(userSnap(uid, 'Yeni'));
    }) as never);
    const onNext = jest.fn();
    subscribeMembers('h1')(onNext, jest.fn());

    pushHome({ data: () => ({ memberIds: ['slow'] }) });
    pushHome({ data: () => ({ memberIds: ['fast'] }) });
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseSlow();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onNext.mock.calls[0][0][0].displayName).toBe('Yeni');
  });
});
