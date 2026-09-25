import { create } from 'zustand';

import { storage } from '@/shared/lib/storage';

// Tema tercihi kalıcıdır (HANDOFF §3): kullanıcı Profil'de Aydınlık ya da
// Koyu seçene kadar sistem temasını izler ('system'), seçtikten sonra bu
// cihazda hatırlanır. Hesaba değil cihaza ait bir görünüm tercihi olduğu
// için Firestore'a yazılmaz.
export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

function readStoredMode(): ThemeMode {
  const stored = storage.getString('themeMode');
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: readStoredMode(),
  setMode: (mode) => {
    if (mode === 'system') {
      storage.remove('themeMode');
    } else {
      storage.setString('themeMode', mode);
    }
    set({ mode });
  },
}));
