import { parseSpokenItem } from '@/features/item-form/lib/parse-spoken-item';

describe('parseSpokenItem', () => {
  it.each([
    ['iki litre süt', { name: 'Süt', quantity: 2, unit: 'litre' }],
    ['on iki yumurta', { name: 'Yumurta', quantity: 12, unit: undefined }],
    ['3 paket makarna', { name: 'Makarna', quantity: 3, unit: 'paket' }],
    ['bir kilo domates', { name: 'Domates', quantity: 1, unit: 'kg' }],
    ['beş yüz gram peynir', { name: 'Yüz gram peynir', quantity: 5, unit: undefined }],
    ['süt', { name: 'Süt' }],
    ['İnce belli bardak', { name: 'İnce belli bardak' }],
  ])('"%s"', (spoken, expected) => {
    expect(parseSpokenItem(spoken)).toEqual(expected);
  });

  it('yalnızca sayı söylenirse ad olarak kalır', () => {
    expect(parseSpokenItem('iki')).toEqual({ name: 'İki' });
  });
});
