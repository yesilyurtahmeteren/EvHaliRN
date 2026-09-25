import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { showToast } from '@/shared/components/toast/toast-store';
import { reportError, useFeedbackMutation } from '@/shared/lib/feedback';

import { regenerateInviteCode, renameHome } from '../api';

export function useRenameHome(homeId: string) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: (name: string) => renameHome({ homeId, name }),
    successMessage: t('dashboard.renameHomeSuccess'),
    errorMessage: t('dashboard.renameHomeError'),
  });
}

export function useRegenerateInviteCode(homeId: string) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: (oldCode: string) => regenerateInviteCode({ homeId, oldCode }),
    successMessage: t('dashboard.regenerateInviteCodeSuccess'),
  });
}

// Flutter share_plus / Clipboard karşılıkları. Kopyalanan ve paylaşılan kod
// boşluksuz ham koddur (Eve Katıl her iki biçimi de kabul ediyor).
export function useInviteCodeSharing() {
  const { t } = useTranslation();

  const share = async (code: string) => {
    try {
      await Share.share({ message: t('dashboard.inviteShareMessage', { code }) });
    } catch (error) {
      reportError(error);
    }
  };

  const copy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    void Haptics.selectionAsync();
    showToast(t('dashboard.inviteCodeCopied'));
  };

  return { share, copy };
}
