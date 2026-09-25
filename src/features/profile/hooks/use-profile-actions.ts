import { useTranslation } from 'react-i18next';

import { deleteAccount } from '@/features/auth/api';
import { useRequiredUser } from '@/features/auth/store';
import { showToast } from '@/shared/components/toast/toast-store';
import { useFeedbackMutation } from '@/shared/lib/feedback';
import { roleOf, type Home } from '@/shared/schemas';

import { leaveHome, setNotificationPref, setTextScale, type NotificationPref } from '../api';

// Yönetici, evde başka üye varken ve başka yönetici yokken ayrılamaz
// (kural da reddeder); önce yöneticiliği devretmeli.
export function mustHandOver(home: Home, uid: string): boolean {
  if (roleOf(home, uid) !== 'admin' || home.memberIds.length <= 1) {
    return false;
  }
  return !home.memberIds.some((m) => m !== uid && roleOf(home, m) === 'admin');
}

function leaveFor(home: Home | null, uid: string) {
  return () =>
    home === null
      ? Promise.resolve()
      : leaveHome({ homeId: home.id, uid, hasRoles: home.roles !== null });
}

// Ayrılınca yönlendirme yok: users.homeId null olunca HomeGate Ev Kur'a geçer.
export function useLeaveHome() {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (home: Home) => leaveFor(home, uid)(),
    errorMessage: t('profile.leaveHomeError'),
  });
}

export function useDeleteAccount() {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (home: Home | null) => deleteAccount(leaveFor(home, uid)),
    errorMessage: t('profile.deleteError'),
    onSuccess: (result) => {
      if (result === 'deleted') {
        showToast(t('profile.deleted'));
      }
    },
  });
}

// Anahtarlar yükleniyor durumu göstermez: Firestore yerel yazmayı
// dinleyicilere hemen yansıtır.
export function useSetNotificationPref() {
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: ({ pref, enabled }: { pref: NotificationPref; enabled: boolean }) =>
      setNotificationPref({ uid, pref, enabled }),
  });
}

export function useSetTextScale() {
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (textScale: number) => setTextScale({ uid, textScale }),
  });
}
