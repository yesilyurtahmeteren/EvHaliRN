// Flutter _handleMarkBought / _toggleHandlerFor: onay kutusuna dokununca ürün
// hemen dolu kutuyla görünür kalır, ~250 ms sonra ~200 ms'de solarak
// kaybolur; bu pencerede tekrar dokunmak ya da toast'taki "Geri al" işlemi
// geri alır. Firestore yazması beklenmez (iyimser); başarısız olursa hata
// gösterilir ve satır geri gelir.
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRequiredUser } from '@/features/auth/store';
import { showToast } from '@/shared/components/toast/toast-store';
import { reportError } from '@/shared/lib/feedback';
import type { Item } from '@/shared/schemas';
import { AppMotion } from '@/shared/theme';

import { markBought, markNeeded } from '../api';

export function useCheckOff(homeId: string) {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  const [leaving, setLeaving] = useState<ReadonlyMap<string, Item>>(new Map());
  const [fading, setFading] = useState<ReadonlySet<string>>(new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const clear = useCallback((itemId: string) => {
    const timer = timers.current.get(itemId);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(itemId);
    }
    setLeaving((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
    setFading((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }, []);

  const undo = useCallback(
    (item: Item) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      clear(item.id);
      markNeeded({ homeId, itemId: item.id }).catch((error: unknown) => reportError(error));
    },
    [clear, homeId],
  );

  const check = useCallback(
    (item: Item) => {
      void Haptics.selectionAsync();
      setLeaving((prev) => new Map(prev).set(item.id, item));
      markBought({ homeId, itemId: item.id, uid }).catch((error: unknown) => {
        clear(item.id);
        reportError(error);
      });

      showToast(t('list.itemBoughtMessage', { name: item.name }), {
        action: { label: t('list.undo'), onPress: () => undo(item) },
      });

      timers.current.set(
        item.id,
        setTimeout(() => {
          setFading((prev) => new Set(prev).add(item.id));
          timers.current.set(
            item.id,
            setTimeout(() => clear(item.id), AppMotion.itemFadeOutDurationMs),
          );
        }, AppMotion.beforeFadeOutDelayMs),
      );
    },
    [clear, homeId, t, uid, undo],
  );

  // Pencere içinde tekrar dokunmak geri almadır.
  const toggle = useCallback(
    (item: Item) => (leaving.has(item.id) ? undo(item) : check(item)),
    [check, leaving, undo],
  );

  // Alınanlar bölümünde kutuya dokunmak ürünü listeye geri koyar (Flutter
  // _BoughtSection: markNeeded).
  const restore = undo;

  return { leaving, fading, toggle, restore };
}
