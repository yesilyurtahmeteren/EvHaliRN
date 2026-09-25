import i18n from '@/shared/i18n';
import { dayGroupOf, eventText, eventTime } from '@/features/notifications/lib/format-event';
import type { HomeEvent } from '@/shared/schemas';

const t = i18n.t.bind(i18n);
const event = (extra: Partial<HomeEvent>): HomeEvent => ({
  id: 'e',
  type: 'added',
  actorId: 'u1',
  count: 1,
  itemNames: ['Süt'],
  createdAt: new Date(),
  readBy: [],
  ...extra,
});

describe('eventText', () => {
  it('ekleme / alma / katılma / hatırlatma / haftalık özet', () => {
    expect(eventText(event({}), 'Defne', t)).toEqual({ who: 'Defne', text: 'listeye Süt ekledi.' });
    expect(
      eventText(
        event({ type: 'bought', count: 3, itemNames: ['Süt', 'Ekmek', 'Yumurta'] }),
        'Emre',
        t,
      ),
    ).toEqual({ who: 'Emre', text: '3 ürün aldı: Süt, Ekmek ve Yumurta.' });
    expect(eventText(event({ type: 'bought' }), 'Emre', t).text).toBe('Süt aldı.');
    expect(eventText(event({ type: 'joined', itemNames: [] }), 'Selin', t).text).toBe(
      'evinize katıldı.',
    );
    expect(eventText(event({ type: 'reminder', actorId: null }), '', t)).toEqual({
      who: 'Hatırlatma:',
      text: 'Süt 3 günden uzun süredir listede bekliyor.',
    });
    expect(eventText(event({ type: 'weekly', count: 18 }), '', t)).toEqual({
      who: 'Haftalık özet:',
      text: 'bu hafta 18 ihtiyaç alındı.',
    });
  });
});

describe('zaman', () => {
  const now = new Date(2026, 8, 25, 12, 0);

  it('Bugün / Dün / Daha önce grupları', () => {
    expect(dayGroupOf(new Date(2026, 8, 25, 0, 5), now)).toBe('today');
    expect(dayGroupOf(new Date(2026, 8, 24, 23, 59), now)).toBe('yesterday');
    expect(dayGroupOf(new Date(2026, 8, 22, 9, 0), now)).toBe('earlier');
  });

  it('göreli zaman metni', () => {
    expect(eventTime(new Date(2026, 8, 25, 11, 50), t, now)).toBe('10 dakika önce');
    expect(eventTime(new Date(2026, 8, 25, 10, 30), t, now)).toBe('1 saat önce');
    expect(eventTime(new Date(2026, 8, 24, 20, 14), t, now)).toBe('Dün, 20:14');
    expect(eventTime(new Date(2026, 8, 23, 9, 0), t, now)).toBe('23 Eylül, 09:00');
  });
});
