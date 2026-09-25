import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/shared/components/toast/toast-host';
import {
  defaultToastDurationMs,
  hideToast,
  showToast,
  useToastStore,
} from '@/shared/components/toast/toast-store';

// Sahte zamanlayıcı kullanılmıyor: RNTL 14'ün async act'i mikro görevleri
// setImmediate ile boşaltıyor, jest fake timers bunu yakalayıp testi
// kilitliyor. Süreler bunun yerine kısa tutuluyor.

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderHost() {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ToastHost />
    </SafeAreaProvider>,
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('toast', () => {
  afterEach(async () => {
    await act(async () => hideToast());
  });

  it('varsayılan süre Flutter SnackBar ile aynı (4 sn)', () => {
    useToastStore.getState().show('A');
    expect(useToastStore.getState().current?.durationMs).toBe(defaultToastDurationMs);
    expect(defaultToastDurationMs).toBe(4000);
  });

  it('mesajı gösterir, süresi dolunca kapanır', async () => {
    await renderHost();
    await act(async () => {
      showToast('Davet kodu kopyalandı.', { durationMs: 50 });
    });
    expect(screen.getByText('Davet kodu kopyalandı.')).toBeOnTheScreen();

    await waitFor(() => expect(screen.queryByText('Davet kodu kopyalandı.')).toBeNull());
  });

  it('eylem düğmesi çalışır ve mesajı kapatır ("Geri al")', async () => {
    const undo = jest.fn();
    await renderHost();
    await act(async () => {
      showToast('Süt alındı', { action: { label: 'Geri al', onPress: undo } });
    });

    await fireEvent.press(screen.getByRole('button', { name: 'Geri al' }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Süt alındı')).toBeNull();
  });

  it('yeni mesaj eskisinin yerini alır; eskinin zamanlayıcısı yenisini kapatmaz', async () => {
    await renderHost();
    await act(async () => {
      showToast('Birinci', { durationMs: 60 });
    });
    await act(async () => {
      showToast('İkinci', { durationMs: 1000 });
    });
    expect(screen.queryByText('Birinci')).toBeNull();

    await act(async () => sleep(120));
    expect(screen.getByText('İkinci')).toBeOnTheScreen();
  });

  it('hide(id) yalnızca o mesaj görünüyorsa kapatır', () => {
    const first = useToastStore.getState().show('A');
    useToastStore.getState().show('B');
    useToastStore.getState().hide(first);
    expect(useToastStore.getState().current?.message).toBe('B');
  });
});
