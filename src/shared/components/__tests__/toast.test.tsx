import { act, screen, waitFor } from '@testing-library/react-native';

import { ToastHost } from '@/shared/components/toast/toast-host';
import {
  defaultToastDurationMs,
  hideToast,
  showToast,
  useToastStore,
} from '@/shared/components/toast/toast-store';
import { renderWithTheme } from '@/test-utils/render';

// Sahte zamanlayıcı kullanılmıyor: RNTL 14'ün async act'i mikro görevleri
// setImmediate ile boşaltıyor, jest fake timers bunu yakalayıp testi
// kilitliyor. Süreler bunun yerine kısa tutuluyor.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('toast', () => {
  afterEach(async () => {
    await act(async () => hideToast());
  });

  it('varsayılan süre tasarımdaki gibi 2.6 sn, hata mesajı 4 sn', () => {
    useToastStore.getState().show('A');
    expect(useToastStore.getState().current?.durationMs).toBe(defaultToastDurationMs);
    expect(defaultToastDurationMs).toBe(2600);
    useToastStore.getState().show('B', { kind: 'error' });
    expect(useToastStore.getState().current?.durationMs).toBe(4000);
  });

  it('mesajı gösterir, süresi dolunca kapanır', async () => {
    await renderWithTheme(<ToastHost />);
    await act(async () => {
      showToast('Süt listeye eklendi', { durationMs: 50 });
    });
    expect(screen.getByText('Süt listeye eklendi')).toBeOnTheScreen();

    await waitFor(() => expect(screen.queryByText('Süt listeye eklendi')).toBeNull());
  });

  it('hata mesajı ekran okuyucuya uyarı olarak okunur', async () => {
    await renderWithTheme(<ToastHost />);
    await act(async () => {
      showToast('Bir şeyler ters gitti', { kind: 'error', durationMs: 1000 });
    });
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });

  it('yeni mesaj eskisinin yerini alır; eskinin zamanlayıcısı yenisini kapatmaz', async () => {
    await renderWithTheme(<ToastHost />);
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
