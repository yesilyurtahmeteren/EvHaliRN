// Flutter ScaffoldMessenger.showSnackBar karşılığı. Aynı anda tek mesaj
// gösterilir; yenisi eskisinin yerini alır (Flutter kuyruğa alıyordu, ama
// "X alındı / Geri al" gibi art arda gelen mesajlarda en güncelinin hemen
// görünmesi daha doğru).
import { create } from 'zustand';

// Flutter SnackBar varsayılan süresi.
export const defaultToastDurationMs = 4000;

export type ToastAction = { label: string; onPress: () => void };

export type Toast = {
  id: number;
  message: string;
  action?: ToastAction;
  durationMs: number;
};

type ToastState = {
  current: Toast | null;
  show: (message: string, options?: { action?: ToastAction; durationMs?: number }) => number;
  hide: (id?: number) => void;
};

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  show: (message, options = {}) => {
    const id = nextId++;
    set({
      current: {
        id,
        message,
        action: options.action,
        durationMs: options.durationMs ?? defaultToastDurationMs,
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
  options?: { action?: ToastAction; durationMs?: number },
): number {
  return useToastStore.getState().show(message, options);
}

export function hideToast(id?: number): void {
  useToastStore.getState().hide(id);
}
