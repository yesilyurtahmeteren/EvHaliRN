// Bildirim kartının metni ve zamanı. Türkçe ek sorununa düşmemek için
// ürün adlarından sonra ek getirilmez ("Süt aldı", "3 ürün aldı: A, B ve C").
import type { TFunction } from 'i18next';

import { joinNames } from '@/shared/lib/join-names';
import type { HomeEvent } from '@/shared/schemas';

export function eventText(
  event: HomeEvent,
  actorName: string,
  t: TFunction,
): { who: string; text: string } {
  const names = joinNames(event.itemNames, t('common.and'));
  switch (event.type) {
    case 'added':
      return {
        who: actorName,
        text:
          event.count <= 1 && event.itemNames.length > 0
            ? t('notifications.addedOne', { name: event.itemNames[0] })
            : t('notifications.addedMany', { count: event.count, names }),
      };
    case 'bought':
      return {
        who: actorName,
        text:
          event.count <= 1 && event.itemNames.length > 0
            ? t('notifications.boughtOne', { name: event.itemNames[0] })
            : t('notifications.boughtMany', { count: event.count, names }),
      };
    case 'joined':
      return { who: actorName, text: t('notifications.joined') };
    case 'reminder':
      return {
        who: t('notifications.reminderWho'),
        text:
          event.count <= 1
            ? t('notifications.reminderOne', { names })
            : t('notifications.reminderMany', { count: event.count, names }),
      };
    case 'weekly':
      return {
        who: t('notifications.weeklyWho'),
        text: t('notifications.weekly', { count: event.count }),
      };
  }
}

export type DayGroup = 'today' | 'yesterday' | 'earlier';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function dayGroupOf(date: Date, now = new Date()): DayGroup {
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  return diffDays <= 0 ? 'today' : diffDays === 1 ? 'yesterday' : 'earlier';
}

const pad = (n: number) => String(n).padStart(2, '0');
const months = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

// "10 dakika önce", "1 saat önce", "Dün, 20:14", "23 Eylül, 09:00".
export function eventTime(date: Date, t: TFunction, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const group = dayGroupOf(date, now);
  if (group === 'today') {
    if (minutes < 1) {
      return t('notifications.justNow');
    }
    if (minutes < 60) {
      return t('notifications.minutesAgo', { count: minutes });
    }
    return t('notifications.hoursAgo', { count: Math.floor(minutes / 60) });
  }
  if (group === 'yesterday') {
    return t('notifications.yesterdayAt', { time: clock });
  }
  return `${date.getDate()} ${months[date.getMonth()]}, ${clock}`;
}
