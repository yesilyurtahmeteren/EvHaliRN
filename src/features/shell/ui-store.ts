// Kabuk düzeyindeki geçici arayüz durumu: açık alt sayfa ve liste
// vurguları. Firestore'a yazılmaz.
import { create } from 'zustand';

export type OpenSheet = { kind: 'item'; itemId: string | null } | { kind: 'member'; uid: string };

type ShellUiState = {
  sheet: OpenSheet | null;
  // Kapanış animasyonu sürüyor (260 ms); bitince sheet null olur.
  closing: boolean;
  openItemSheet: (itemId?: string | null) => void;
  openMemberSheet: (uid: string) => void;
  requestCloseSheet: () => void;
  sheetClosed: () => void;

  // Yeni eklenen ya da geri alınan ürün 1.8 s halka ile vurgulanır.
  flash: { id: string; key: number } | null;
  setFlash: (id: string) => void;
  // Sayaç "bump" animasyonu; her artışta bir kez.
  bumpKey: number;
  bump: () => void;
};

export const useShellUi = create<ShellUiState>((set) => ({
  sheet: null,
  closing: false,
  openItemSheet: (itemId = null) => set({ sheet: { kind: 'item', itemId }, closing: false }),
  openMemberSheet: (uid) => set({ sheet: { kind: 'member', uid }, closing: false }),
  requestCloseSheet: () => set((state) => (state.sheet === null ? state : { closing: true })),
  sheetClosed: () => set({ sheet: null, closing: false }),

  flash: null,
  setFlash: (id) => set((state) => ({ flash: { id, key: (state.flash?.key ?? 0) + 1 } })),
  bumpKey: 0,
  bump: () => set((state) => ({ bumpKey: state.bumpKey + 1 })),
}));
