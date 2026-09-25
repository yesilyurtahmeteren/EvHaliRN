// Flutter ScaledTextScaler karşılığı: kullanıcının Profil'de seçtiği yazı
// boyutu çarpanı (users/{uid}.textScale). Sistem yazı ölçeği RN'de
// allowFontScaling ile zaten uygulanıyor; bu çarpan onun ÜSTÜNE, AppText
// içinde fontSize/lineHeight ile çarpılır. Kaynak Firestore'daki users
// dokümanı; Faz 4'te o doküman dinlenirken buraya yazılır, çıkışta 1.0.
import { create } from 'zustand';

type TextScaleState = {
  multiplier: number;
  setMultiplier: (multiplier: number) => void;
};

export const useTextScaleStore = create<TextScaleState>((set) => ({
  multiplier: 1,
  setMultiplier: (multiplier) => set({ multiplier }),
}));
