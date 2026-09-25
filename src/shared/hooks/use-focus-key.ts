// Sekmeler bağlı kaldığı için ekran içeriği her odaklanışta yeniden
// kurulmaz. Tasarımda ise her ekran değişiminde giriş animasyonları
// (.scr, .rise, sayaçlar) baştan oynar; ekran içeriği bu anahtarla
// odaklandıkça yeniden bağlanır. 0 = henüz odaklanmadı.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useFocusKey(): number {
  const [key, setKey] = useState(0);
  useFocusEffect(useCallback(() => setKey((k) => k + 1), []));
  return key;
}
