import { getDoc, setDoc, updateDoc } from '@react-native-firebase/firestore';

import { createHome, InvalidInviteCodeError, joinHome } from '@/features/home-onboarding/api';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn((_db, name: string) => ({ collection: name })),
  doc: jest.fn((parent: { collection?: string }, ...path: string[]) =>
    path.length === 0
      ? { id: 'newHome', path: `${parent.collection}/newHome` }
      : { id: path[path.length - 1], path: path.join('/') },
  ),
  getDoc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  arrayUnion: jest.fn((...values: unknown[]) => ({ arrayUnion: values })),
}));
jest.mock('@/shared/lib/invite-code', () => ({
  ...jest.requireActual('@/shared/lib/invite-code'),
  generateInviteCode: () => 'AB7K9TQX',
}));

beforeEach(() => jest.clearAllMocks());

const writes = () => [
  ...jest
    .mocked(setDoc)
    .mock.calls.map(([ref, data]) => ['set', (ref as { path: string }).path, data]),
  ...jest
    .mocked(updateDoc)
    .mock.calls.map(([ref, data]) => ['update', (ref as { path: string }).path, data]),
];

describe('createHome', () => {
  it('üç yazma: homes (kurucu yönetici), invites, users.homeId (en son)', async () => {
    await expect(createHome({ name: 'Yeşilyurt Evi', uid: 'u1' })).resolves.toBe('newHome');

    expect(writes()).toEqual([
      [
        'set',
        'homes/newHome',
        {
          name: 'Yeşilyurt Evi',
          memberIds: ['u1'],
          inviteCode: 'AB7K9TQX',
          createdAt: 'SERVER_TIMESTAMP',
          roles: { u1: 'admin' },
        },
      ],
      ['set', 'invites/AB7K9TQX', { homeId: 'newHome', createdAt: 'SERVER_TIMESTAMP' }],
      ['update', 'users/u1', { homeId: 'newHome' }],
    ]);
    // users.homeId sekmeleri açar; ev ve davet kodundan sonra yazılmalı.
    const lastSet = Math.max(...jest.mocked(setDoc).mock.invocationCallOrder);
    expect(jest.mocked(updateDoc).mock.invocationCallOrder[0]).toBeGreaterThan(lastSet);
  });
});

describe('joinHome', () => {
  it("boşluklu/tireli/küçük harfli kodu temizleyip kendi uid'ini ekler, 'katıldı' kaydı yazar", async () => {
    jest.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({ homeId: 'h1', createdAt: null }),
    } as never);

    await expect(joinHome({ code: ' ab7k-9tqx ', uid: 'u2' })).resolves.toBe('h1');
    expect(jest.mocked(getDoc).mock.calls[0][0]).toMatchObject({ path: 'invites/AB7K9TQX' });
    expect(writes()).toEqual([
      [
        'set',
        'homes/newHome',
        { type: 'joined', actorId: 'u2', createdAt: 'SERVER_TIMESTAMP', readBy: ['u2'] },
      ],
      ['update', 'homes/h1', { memberIds: { arrayUnion: ['u2'] } }],
      ['update', 'users/u2', { homeId: 'h1' }],
    ]);
    // Kayıt üyelikten sonra yazılır (kural isMember istiyor).
    expect(jest.mocked(setDoc).mock.invocationCallOrder[0]).toBeGreaterThan(
      Math.max(...jest.mocked(updateDoc).mock.invocationCallOrder),
    );
  });

  it('olmayan kodda InvalidInviteCodeError, hiçbir şey yazılmaz', async () => {
    jest.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);

    await expect(joinHome({ code: 'ZZZZZZZZ', uid: 'u2' })).rejects.toBeInstanceOf(
      InvalidInviteCodeError,
    );
    expect(writes()).toEqual([]);
  });

  it("boş ya da '/' içeren kod Firestore'a hiç sorulmaz", async () => {
    await expect(joinHome({ code: '   ', uid: 'u2' })).rejects.toBeInstanceOf(
      InvalidInviteCodeError,
    );
    await expect(joinHome({ code: 'AB/K9TQX', uid: 'u2' })).rejects.toBeInstanceOf(
      InvalidInviteCodeError,
    );
    expect(getDoc).not.toHaveBeenCalled();
  });
});
