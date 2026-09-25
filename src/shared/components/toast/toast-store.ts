// Main.dc.html toast'u: tek mesaj, alttan girer, 2.6 s sonra kaybolur.
// Yenisi eskisinin yerini alır.
import { create } from 'zustand';

export const defaultToastDurationMs = 2600;

export type ToastKind = 'success' | 'error';

export type Toast = {
  id: number;
  message: string;
  kind: ToastKind;
  durationMs: number;
};

type ToastState = {
  current: Toast | null;
  // Alt kenardan boşluk: gezinme çubuğu görünürken mesaj çubuğun üstünde
  // çıkar (ShellTabBar yüksekliğini buraya yazar, kalkınca sıfırlar).
  bottomOffset: number;
  setBottomOffset: (offset: number) => void;
  show: (message: string, options?: { kind?: ToastKind; durationMs?: number }) => number;
  hide: (id?: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  bottomOffset: 0,
  setBottomOffset: (bottomOffset) => set({ bottomOffset }),
  show: (message, options = {}) => {
    const id = nextId++;
    set({
      current: {
        id,
        message,
        kind: options.kind ?? 'success',
        // Hata mesajı okunabilsin diye biraz daha uzun kalır.
        durationMs:
          options.durationMs ?? (options.kind === 'error' ? 4000 : defaultToastDurationMs),
      },
    });
    return id;
  },
  // id verilirse yalnızca o mesaj hâlâ görünüyorsa kapatılır; zamanlayıcısı
  // geç kalan eski bir mesaj yenisini kapatmasın.
  hide: (id) => {
    const { current } = get();
    if (current !== null && (id === undefined || current.id === id)) {
      set({ current: null });
    }
  },
}));

export function showToast(
  message: string,
  options?: { kind?: ToastKind; durationMs?: number },
): number {
  return useToastStore.getState().show(message, options);
}

export function hideToast(id?: number): void {
  useToastStore.getState().hide(id);
}
