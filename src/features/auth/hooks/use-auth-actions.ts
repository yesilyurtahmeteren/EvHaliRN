import { useTranslation } from 'react-i18next';

import { useFeedbackMutation } from '@/shared/lib/feedback';

import { signInWithGoogle, signOut } from '../api';

// Başarılı girişte yönlendirme yapılmaz: oturum değişince korumalı rotalar
// (app/_layout.tsx) kendiliğinden doğru ekrana geçer.
export function useSignIn() {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: signInWithGoogle,
    errorMessage: t('auth.signInError'),
  });
}

export function useSignOut() {
  return useFeedbackMutation({ mutationFn: signOut });
}
