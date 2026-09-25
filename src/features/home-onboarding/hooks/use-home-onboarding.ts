import { useTranslation } from 'react-i18next';

import { useRequiredUser } from '@/features/auth/store';
import { useFeedbackMutation } from '@/shared/lib/feedback';

import { createHome, joinHome } from '../api';

// Başarıda yönlendirme yok: users/{uid}.homeId değişince HomeGate
// ((app)/_layout.tsx) sekmelere kendiliğinden geçer.
export function useCreateHome() {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (name: string) => createHome({ name, uid }),
    errorMessage: t('onboarding.createHomeError'),
  });
}

// Flutter: kod bulunamasa da ağ hatası da olsa "Geçersiz davet kodu."
export function useJoinHome() {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: (code: string) => joinHome({ code, uid }),
    errorMessage: t('onboarding.invalidInviteCode'),
  });
}
