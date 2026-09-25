import { useEffect } from 'react';

import { getPushSubscriptionId, onPushSubscriptionChange, savePushToken } from '../api';

// Flutter HomeGate initState: NotificationService.syncPushToken(uid).
// Oturum açıkken bu cihazın abonelik kimliğini kaydeder ve kimlik
// değişirse (yeniden yükleme, izin sonradan verildi) yenisini ekler.
// Arka plan işi: başarısız olursa bir sonraki açılışta tekrar denenir,
// kullanıcıya hata gösterilmez (Flutter'da da sessizdi).
export function usePushTokenSync(uid: string): void {
  useEffect(() => {
    let active = true;
    const save = (token: string | null) => {
      if (!active || token === null || token.length === 0) {
        return;
      }
      savePushToken({ uid, token }).catch((error: unknown) => {
        if (__DEV__) {
          console.warn('savePushToken failed', error);
        }
      });
    };

    getPushSubscriptionId()
      .then(save)
      .catch((error: unknown) => {
        if (__DEV__) {
          console.warn('getPushSubscriptionId failed', error);
        }
      });
    const unsubscribe = onPushSubscriptionChange(save);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);
}
