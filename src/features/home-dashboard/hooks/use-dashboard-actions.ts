import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { showToast } from '@/shared/components/toast/toast-store';
import { reportError, useFeedbackMutation } from '@/shared/lib/feedback';
import { formatInviteCode } from '@/shared/lib/invite-code';
import { roleOf, type AppUser, type Home, type HomeRole } from '@/shared/schemas';

import { regenerateInviteCode, removeMember, renameHome, setMemberRoles } from '../api';

export function useRenameHome(homeId: string) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: (name: string) => renameHome({ homeId, name }),
    successMessage: t('dashboard.renameHomeSuccess'),
  });
}

export function useRegenerateInviteCode(homeId: string) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: (oldCode: string) => regenerateInviteCode({ homeId, oldCode }),
    successMessage: t('dashboard.regenerateSuccess'),
  });
}

// Kopyalanan ve paylaşılan kod "AB7K-9TQX" biçiminde; Eve Katıl tireli ve
// tiresiz her iki biçimi kabul ediyor.
export function useInviteCodeSharing() {
  const { t } = useTranslation();

  const share = async (code: string) => {
    try {
      await Share.share({ message: t('dashboard.shareMessage', { code: formatInviteCode(code) }) });
    } catch (error) {
      reportError(error);
    }
  };

  const copy = async (code: string) => {
    await Clipboard.setStringAsync(formatInviteCode(code));
    void Haptics.selectionAsync();
  };

  return { share, copy };
}

// Rol haritasının yazılacak tam hali: eski evlerde harita yoksa kurucu
// (memberIds[0]) yönetici olarak eklenir; artık üye olmayanların kayıtları
// atılır.
export function nextRoles(home: Home, uid: string, role: HomeRole): Record<string, HomeRole> {
  const roles: Record<string, HomeRole> = {};
  for (const member of home.memberIds) {
    const current = roleOf(home, member);
    if (current !== 'member') {
      roles[member] = current;
    }
  }
  if (role === 'member') {
    delete roles[uid];
  } else {
    roles[uid] = role;
  }
  return roles;
}

export function useSetMemberRole(homeId: string) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: async ({ home, member, role }: { home: Home; member: AppUser; role: HomeRole }) => {
      const roles = nextRoles(home, member.uid, role);
      await setMemberRoles({ homeId, roles });
    },
    onSuccess: (_data, { member, role }) =>
      showToast(t('members.roleChanged', { name: member.displayName, role: t(`roles.${role}`) })),
  });
}

export function useRemoveMember(homeId: string) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: ({ home, member }: { home: Home; member: AppUser }) =>
      removeMember({ homeId, uid: member.uid, hasRoles: home.roles !== null }),
    onSuccess: (_data, { member }) => showToast(t('members.removed', { name: member.displayName })),
  });
}
