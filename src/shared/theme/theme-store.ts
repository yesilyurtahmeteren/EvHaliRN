import { create } from 'zustand';

// Flutter ThemeModeController karşılığı: oturum içi tercih, KASITLI olarak
// kalıcı değil - uygulama yeniden açılınca sistem temasına döner.
export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode) => set({ mode }),
}));
