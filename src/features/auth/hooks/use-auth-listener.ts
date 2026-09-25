import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useTextScaleStore } from '@/shared/theme/text-scale-store';

import { useSessionStore } from '../store';

// Kök layout'ta bir kez çağrılır: Firebase oturumunu store'a yansıtır.
// Çıkışta önceki kullanıcının tüm cache'i ve canlı Firestore dinleyicileri
// kapatılır (live-query 'removed' olayında dinleyiciyi kapatıyor); aksi
// halde kapanmayan dinleyiciler izin hatası verir ve veri sızabilir.
export function useAuthListener(): void {
  const queryClient = useQueryClient();
  const setUser = useSessionStore((s) => s.setUser);

  useEffect(() => {
    return onAuthStateChanged(getAuth(), (user) => {
      if (user === null) {
        queryClient.clear();
        useTextScaleStore.getState().setMultiplier(1);
        setUser(null);
        return;
      }
      const previous = useSessionStore.getState().user;
      if (previous !== null && previous.uid !== user.uid) {
        queryClient.clear();
      }
      setUser({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
    });
  }, [queryClient, setUser]);
}
