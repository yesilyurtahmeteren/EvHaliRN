import { groupByCategory } from '@/features/shopping-list/lib/group-items';
import type { Item, ItemCategory } from '@/shared/schemas';

const item = (id: string, name: string, extra: Partial<Item> = {}): Item => ({
  id,
  name,
  status: 'needed',
  addedBy: 'u1',
  addedAt: new Date('2026-09-20T08:00:00Z'),
  boughtBy: null,
  boughtAt: null,
  quantity: 1,
  note: null,
  unit: 'adet',
  urgent: false,
  ...extra,
});

const categories = new Map<string, ItemCategory | null>([
  ['süt', 'food'],
  ['elma', 'food'],
  ['deterjan', 'clean'],
  ['şampuan', 'care'],
  ['pil', null],
]);

describe('groupByCategory', () => {
  it('sabit sırayla gruplar (Gıda, Temizlik, Kişisel Bakım, Diğer); kategorisiz "Diğer"de', () => {
    const groups = groupByCategory(
      [
        item('1', 'Deterjan'),
        item('2', 'Süt'),
        item('3', 'Pil'),
        item('4', 'Şampuan'),
        item('5', 'Yeni Ürün'),
      ],
      categories,
    );

    expect(groups.map((g) => [g.category, g.items.map((i) => i.id)])).toEqual([
      ['food', ['2']],
      ['clean', ['1']],
      ['care', ['4']],
      ['other', ['3', '5']],
    ]);
  });

  it('bölüm içinde acil ürünler en üstte, sonra en yeni eklenen', () => {
    const groups = groupByCategory(
      [
        item('eski', 'Süt', { addedAt: new Date('2026-09-18T08:00:00Z') }),
        item('yeni', 'SÜT ', { addedAt: new Date('2026-09-22T08:00:00Z') }),
        item('acil', 'Elma', { urgent: true, addedAt: new Date('2026-09-10T08:00:00Z') }),
      ],
      categories,
    );
    expect(groups[0].items.map((i) => i.id)).toEqual(['acil', 'yeni', 'eski']);
  });

  it('geri alınan ürün bölümünün başına döner', () => {
    const groups = groupByCategory(
      [
        item('a', 'Süt', { addedAt: new Date('2026-09-22T08:00:00Z') }),
        item('b', 'Elma', { addedAt: new Date('2026-09-01T08:00:00Z') }),
      ],
      categories,
      new Map([['b', new Date('2026-09-25T08:00:00Z').getTime()]]),
    );
    expect(groups[0].items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('boş listede grup yok', () => {
    expect(groupByCategory([], categories)).toEqual([]);
  });
});
