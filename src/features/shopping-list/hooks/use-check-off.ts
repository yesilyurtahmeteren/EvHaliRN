// Ürünü alma (HANDOFF §2.2): onay kutusuna dokununca kutu dolar, tik çizilir,
// satır %55 opaklığa iner ve 10 px sağa kayar; 600 ms sonra ürün "Alınanlar"a
// taşınır (Firestore yazması o an yapılır), sayaç zıplar. Bu 600 ms içinde
// tekrar dokunmak işlemi iptal eder. Ekrandan çıkılırsa bekleyen işaretler
// hemen yazılır, kaybolmaz.
//
// Geri al: ürün listeye döner, listenin başına alınır ve 1.8 s halka ile
// vurgulanır.
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useRequiredUser } from '@/features/auth/store';
import { useShellUi } from '@/features/shell/ui-store';
import { reportError } from '@/shared/lib/feedback';
import type { Item } from '@/shared/schemas';
import { Durations } from '@/shared/theme';

import { markBought, markNeeded } from '../api';

export function useCheckOff(homeId: string) {
  const { uid } = useRequiredUser();
  const [checking, setChecking] = useState<ReadonlySet<string>>(new Set());
  // Geri alınan ürünler bu oturumda listenin başında durur.
  const [restoredAt, setRestoredAt] = useState<ReadonlyMap<string, number>>(new Map());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const commit = useCallback(
    (itemId: string) => {
      markBought({ homeId, itemId, uid }).catch((error: unknown) => reportError(error));
    },
    [homeId, uid],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer, itemId) => {
        clearTimeout(timer);
        commit(itemId);
      });
      pending.clear();
    };
  }, [commit]);

  const drop = (itemId: string) =>
    setChecking((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });

  const toggle = useCallback(
    (item: Item) => {
      const timer = timers.current.get(item.id);
      if (timer !== undefined) {
        clearTimeout(timer);
        timers.current.delete(item.id);
        drop(item.id);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      void Haptics.selectionAsync();
      setChecking((prev) => new Set(prev).add(item.id));
      timers.current.set(
        item.id,
        setTimeout(() => {
          timers.current.delete(item.id);
          commit(item.id);
          drop(item.id);
          useShellUi.getState().bump();
        }, Durations.checkOff),
      );
    },
    [commit],
  );

  const restore = useCallback(
    (item: Item) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setRestoredAt((prev) => new Map(prev).set(item.id, Date.now()));
      const ui = useShellUi.getState();
      ui.setFlash(item.id);
      ui.bump();
      markNeeded({ homeId, itemId: item.id }).catch((error: unknown) => reportError(error));
    },
    [homeId],
  );

  return { checking, restoredAt, toggle, restore };
}
