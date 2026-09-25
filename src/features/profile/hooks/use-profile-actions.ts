import { useTranslation } from 'react-i18next';

import { useRequiredUser } from '@/features/auth/store';
import { useFeedbackMutation } from '@/shared/lib/feedback';

import { leaveHome, setNotificationsEnabled, setTextScale } from '../api';

// Ayrılınca yönlendirme yok: users.homeId null olunca HomeGate Ev Oluştur'a geçer.
export function useLeaveHome() {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (homeId: string) => leaveHome({ homeId, uid }),
    errorMessage: t('profile.leaveHomeError'),
  });
}

// Anahtar ve çipler yükleniyor durumu göstermez: Firestore yerel yazmayı
// dinleyicilere hemen yansıtır, ekran anında güncellenir. Flutter bu iki
// yazmanın hatasını göstermiyordu (sessizdi); burada genel hata mesajı var.
export function useSetNotificationsEnabled() {
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (enabled: boolean) => setNotificationsEnabled({ uid, enabled }),
  });
}

export function useSetTextScale() {
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (textScale: number) => setTextScale({ uid, textScale }),
  });
}
