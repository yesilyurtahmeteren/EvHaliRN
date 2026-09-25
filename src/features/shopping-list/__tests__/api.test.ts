import {
  getDocs,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';

import {
  addItem,
  cleanupOldBoughtItems,
  fetchTopCatalog,
  markBought,
  markNeeded,
} from '@/features/shopping-list/api';

const mockTransaction = { get: jest.fn(), set: jest.fn() };
const mockBatch = { delete: jest.fn(), commit: jest.fn(() => Promise.resolve()) };

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn((_db, ...path: string[]) => ({ collection: path.join('/') })),
  doc: jest.fn((parent: { collection?: string }, ...path: string[]) =>
    path.length === 0 ? { path: `${parent.collection}/newItem` } : { path: path.join('/') },
  ),
  runTransaction: jest.fn((_db, fn: (t: unknown) => Promise<void>) => fn(mockTransaction)),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
  updateDoc: jest.fn(() => Promise.resolve()),
  getDocs: jest.fn(),
  query: jest.fn((ref, ...constraints: unknown[]) => ({ ref, constraints })),
  where: jest.fn((field, op, value) => ({ where: [field, op, value] })),
  orderBy: jest.fn((field, dir) => ({ orderBy: [field, dir] })),
  limit: jest.fn((n) => ({ limit: n })),
  writeBatch: jest.fn(() => mockBatch),
  Timestamp: { fromDate: (date: Date) => ({ date }) },
}));

beforeEach(() => jest.clearAllMocks());

const catalogSnap = (data: Record<string, unknown> | null) => ({
  exists: () => data !== null,
  data: () => data ?? undefined,
});

const sets = () =>
  mockTransaction.set.mock.calls.map(([ref, data]) => [(ref as { path: string }).path, data]);

describe('addItem', () => {
  it('hızlı ekleme: ürün + katalog sayacı, mevcut kategori korunur', async () => {
    mockTransaction.get.mockResolvedValue(
      catalogSnap({ name: 'Süt', count: 4, category: 'dairy_breakfast' }),
    );

    await addItem({ homeId: 'h1', name: 'Süt', uid: 'u1' });

    expect(runTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.get.mock.calls[0][0]).toEqual({ path: 'homes/h1/catalog/süt' });
    expect(sets()).toEqual([
      [
        'homes/h1/items/newItem',
        {
          name: 'Süt',
          status: 'needed',
          addedBy: 'u1',
          addedAt: 'SERVER_TIMESTAMP',
          boughtBy: null,
          boughtAt: null,
          notified: false,
          quantity: 1,
          note: null,
          unit: 'adet',
          urgent: false,
        },
      ],
      [
        'homes/h1/catalog/süt',
        { name: 'Süt', count: 5, lastUsedAt: 'SERVER_TIMESTAMP', category: 'dairy_breakfast' },
      ],
    ]);
  });

  it('katalogda yoksa sayaç 1, kategori null; ID normalize ad', async () => {
    mockTransaction.get.mockResolvedValue(catalogSnap(null));

    await addItem({ homeId: 'h1', name: '  IRMAK ', uid: 'u1' });

    expect(sets()[1]).toEqual([
      'homes/h1/catalog/irmak',
      { name: '  IRMAK ', count: 1, lastUsedAt: 'SERVER_TIMESTAMP', category: null },
    ]);
  });

  it('formdan gelen kategori (null dahil) mevcut kategorinin yerine yazılır', async () => {
    mockTransaction.get.mockResolvedValue(catalogSnap({ count: 2, category: 'dairy_breakfast' }));

    await addItem({
      homeId: 'h1',
      name: 'Süt',
      uid: 'u1',
      category: null,
      quantity: 2,
      unit: 'litre',
      urgent: true,
      note: 'Pınar',
    });

    expect(sets()[0][1]).toMatchObject({ quantity: 2, unit: 'litre', urgent: true, note: 'Pınar' });
    expect(sets()[1][1]).toMatchObject({ count: 3, category: null });
  });
});

describe('durum değişimi', () => {
  it('markBought / markNeeded yalnızca status, boughtBy, boughtAt yazar', async () => {
    await markBought({ homeId: 'h1', itemId: 'i1', uid: 'u2' });
    await markNeeded({ homeId: 'h1', itemId: 'i1' });

    expect(jest.mocked(updateDoc).mock.calls).toEqual([
      [
        { path: 'homes/h1/items/i1' },
        { status: 'bought', boughtBy: 'u2', boughtAt: 'SERVER_TIMESTAMP' },
      ],
      [{ path: 'homes/h1/items/i1' }, { status: 'needed', boughtBy: null, boughtAt: null }],
    ]);
  });
});

describe('cleanupOldBoughtItems', () => {
  it('7 günden eski alınanları tek batch ile siler', async () => {
    const now = Date.parse('2026-09-25T12:00:00Z');
    jest.mocked(getDocs).mockResolvedValue({
      empty: false,
      size: 2,
      docs: [{ ref: 'ref-a' }, { ref: 'ref-b' }],
    } as never);

    await expect(cleanupOldBoughtItems('h1', now)).resolves.toBe(2);

    expect(where).toHaveBeenCalledWith('status', '==', 'bought');
    expect(where).toHaveBeenCalledWith('boughtAt', '<', {
      date: new Date('2026-09-18T12:00:00Z'),
    });
    expect(mockBatch.delete.mock.calls).toEqual([['ref-a'], ['ref-b']]);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('silinecek yoksa batch açılmaz', async () => {
    jest.mocked(getDocs).mockResolvedValue({ empty: true, size: 0, docs: [] } as never);
    await expect(cleanupOldBoughtItems('h1')).resolves.toBe(0);
    expect(writeBatch).not.toHaveBeenCalled();
  });
});

describe('fetchTopCatalog', () => {
  it("count'a göre azalan ilk 12 kaydı şemadan geçirerek döner", async () => {
    jest.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'süt', data: () => ({ name: 'Süt', count: 9, category: 'dairy_breakfast' }) }],
    } as never);

    await expect(fetchTopCatalog('h1')).resolves.toEqual([
      { id: 'süt', name: 'Süt', count: 9, category: 'dairy_breakfast' },
    ]);
    const [q] = jest.mocked(getDocs).mock.calls[0] as unknown as [{ constraints: unknown[] }];
    expect(q.constraints).toEqual([{ orderBy: ['count', 'desc'] }, { limit: 12 }]);
  });
});
