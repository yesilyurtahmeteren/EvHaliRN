// Evim "Bu hafta" halkası ve Profil istatistikleri: son 7 günde alınanlar
// (alınan kayıtlar 7 gün sonra zaten temizleniyor) ve listenin ne kadarının
// tamamlandığı = alınan / (alınan + bekleyen).
import { useState } from 'react';

import { useBoughtItems, useNeededItems } from './use-items';

const weekMs = 7 * 24 * 60 * 60 * 1000;

export function useWeekStats(homeId: string) {
  const needed = useNeededItems(homeId).data?.items.length ?? 0;
  const boughtItems = useBoughtItems(homeId).data?.items ?? [];
  // Ekran açıldığı anki "şimdi" yeterli (liste zaten 7 günde temizleniyor).
  const [since] = useState(() => Date.now() - weekMs);
  const bought = boughtItems.filter(
    (item) => item.boughtAt === null || item.boughtAt.getTime() >= since,
  ).length;
  const total = bought + needed;
  return { bought, pending: needed, percent: total === 0 ? 0 : Math.round((bought / total) * 100) };
}
