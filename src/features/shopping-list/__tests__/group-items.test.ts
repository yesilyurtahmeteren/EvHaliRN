import { groupByCategory, withLeavingItems } from '@/features/shopping-list/lib/group-items';
import type { Item, ItemCategory } from '@/shared/schemas';

const item = (id: string, name: string): Item => ({
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
});

const categories = new Map<string, ItemCategory | null>([
  ['süt', 'dairy_breakfast'],
  ['elma', 'fruit_vegetable'],
  ['deterjan', 'cleaning'],
  ['pil', null],
]);

describe('groupByCategory', () => {
  it('markette yürüme sırasına göre gruplar, kategorisiz ve katalogda olmayan "Diğer"de', () => {
    const groups = groupByCategory(
      [
        item('1', 'Deterjan'),
        item('2', 'Süt'),
        item('3', 'Pil'),
        item('4', 'Elma'),
        item('5', 'Yeni Ürün'),
        item('6', 'SÜT '),
      ],
      categories,
    );

    expect(groups.map((g) => [g.category, g.items.map((i) => i.id)])).toEqual([
      ['fruit_vegetable', ['4']],
      ['dairy_breakfast', ['2', '6']],
      ['cleaning', ['1']],
      ['other', ['3', '5']],
    ]);
  });

  it('boş listede grup yok', () => {
    expect(groupByCategory([], categories)).toEqual([]);
  });
});

describe('withLeavingItems', () => {
  it('sorgudan çıkmış ama animasyonu süren ürünleri sona ekler, çift eklemez', () => {
    const a = item('a', 'A');
    const b = item('b', 'B');
    const c = item('c', 'C');
    const leaving = new Map([
      ['b', b],
      ['c', c],
    ]);

    expect(withLeavingItems([a, b], leaving).map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});
