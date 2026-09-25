import { getAuth } from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/shared/components/toast/toast-store';
import { useFeedbackMutation } from '@/shared/lib/feedback';

import { signInWithGoogle, signOut } from '../api';

// Başarılı girişte yönlendirme yapılmaz: oturum değişince korumalı rotalar
// (app/_layout.tsx) kendiliğinden doğru ekrana geçer. Tasarımdaki gibi
// "Hoş geldiniz, <ad>" toast'u gösterilir (yalnızca ilk ad; hitap eki
// eklenmez, kişinin cinsiyetini bilmiyoruz).
export function useSignIn() {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: signInWithGoogle,
    errorMessage: t('auth.signInError'),
    onSuccess: (result) => {
      if (result !== 'success') {
        return;
      }
      const first = getAuth().currentUser?.displayName?.trim().split(/\s+/)[0] ?? '';
      showToast(first.length > 0 ? t('auth.welcome', { name: first }) : t('auth.welcomeNoName'));
    },
  });
}

export function useSignOut() {
  return useFeedbackMutation({ mutationFn: signOut });
}
