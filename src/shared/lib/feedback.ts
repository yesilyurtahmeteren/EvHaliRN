// Flutter utils/feedback.dart runWithFeedback karşılığı. Kullanıcının
// başlattığı her yazma işlemi bundan geçer: yükleniyor durumu (isPending),
// hatada orta şiddette titreşim + anlaşılır Türkçe mesaj, isteğe bağlı
// başarı mesajı. Hata hiçbir zaman sessizce yutulmaz.
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { showToast } from '@/shared/components/toast/toast-store';
import i18n from '@/shared/i18n';

import { friendlyErrorKey } from './firebase/errors';

export function reportError(error: unknown, message?: string): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  showToast(message ?? i18n.t(friendlyErrorKey(error)));
}

type FeedbackMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  'onError'
> & {
  successMessage?: string;
  // Verilmezse hata koduna göre genel mesaj (izin hatası ayrı).
  errorMessage?: string;
};

export function useFeedbackMutation<TData = void, TVariables = void>({
  successMessage,
  errorMessage,
  onSuccess,
  ...options
}: FeedbackMutationOptions<TData, TVariables>) {
  const mutation = useMutation<TData, Error, TVariables>({
    ...options,
    onSuccess: (...args) => {
      if (successMessage !== undefined) {
        showToast(successMessage);
      }
      return onSuccess?.(...args);
    },
    onError: (error) => reportError(error, errorMessage),
  });

  // Flutter'daki gibi başarıyı bool döndürür; hata zaten gösterildiği için
  // çağıranın try/catch yazmasına gerek yok.
  const run = async (variables: TVariables): Promise<boolean> => {
    try {
      await mutation.mutateAsync(variables);
      return true;
    } catch {
      return false;
    }
  };

  return { ...mutation, run };
}
