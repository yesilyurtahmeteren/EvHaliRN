// Flutter main.dart HomeGate karşılığı: users/{uid}.homeId'ye göre hangi
// ekran grubunun gösterileceği.
//
// KRİTİK: okuma hatası (ağ, App Check, izin) "evin yok" ile aynı sayılmaz.
// Flutter'da bu ayrım yokken kullanıcı evinden atılmış gibi Ev Oluştur'a
// düşüyordu (Flutter CLAUDE.md, Faz 6 "Yan etki" notu).
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useRequiredUser } from '@/features/auth/store';
import { useUserDoc, userDocKey } from '@/shared/hooks/use-user-doc';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';

export type HomeGateState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; homeId: string | null };

export function useHomeGate(): HomeGateState {
  const { uid } = useRequiredUser();
  const queryClient = useQueryClient();
  const userDoc = useUserDoc();
  const textScale = userDoc.data?.textScale;

  // Flutter EvHaliApp: yazı boyutu çarpanı aynı dokümandan geliyor.
  useEffect(() => {
    useTextScaleStore.getState().setMultiplier(textScale ?? 1);
  }, [textScale]);

  if (userDoc.isPending) {
    return { status: 'loading' };
  }
  if (userDoc.isError) {
    return {
      status: 'error',
      retry: () => void queryClient.resetQueries({ queryKey: userDocKey(uid), exact: true }),
    };
  }
  // Doküman yoksa (ilk girişte henüz yazılmadıysa) da ev yok sayılır.
  return { status: 'ready', homeId: userDoc.data?.homeId ?? null };
}
