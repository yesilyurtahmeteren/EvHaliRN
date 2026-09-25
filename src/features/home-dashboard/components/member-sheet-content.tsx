import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRequiredUser } from '@/features/auth/store';
import { AppText } from '@/shared/components/app-text';
import { Avatar } from '@/shared/components/avatar';
import { Button } from '@/shared/components/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { Icon } from '@/shared/components/icon';
import { PressScale } from '@/shared/components/press-scale';
import { showToast } from '@/shared/components/toast/toast-store';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { homeRoles, roleOf, type HomeRole } from '@/shared/schemas';

import { nextRoles, useRemoveMember, useSetMemberRole } from '../hooks/use-dashboard-actions';

// Yöneticinin bir üyeyi düzenlediği alt sayfa (tasarımda yok; İhtiyaç Ekle
// sayfasının bölüm karolarıyla aynı dil): rol seçimi ve evden çıkarma.
export function MemberSheetContent({ uid, onClose }: { uid: string; onClose: () => void }) {
  const { t } = useTranslation();
  const me = useRequiredUser();
  const homeId = useRequiredHomeId();
  const home = useHome(homeId).data;
  const member = useMembers(homeId).data?.find((m) => m.uid === uid);
  const setRole = useSetMemberRole(homeId);
  const remove = useRemoveMember(homeId);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  if (home == null || member === undefined) {
    return (
      <View style={{ gap: 16, paddingTop: 8 }}>
        <Button label={t('common.close')} variant="well" onPress={onClose} />
      </View>
    );
  }

  const current = roleOf(home, uid);
  const pick = (role: HomeRole) => {
    if (role === current) {
      return;
    }
    const roles = nextRoles(home, uid, role);
    if (!Object.values(roles).includes('admin')) {
      showToast(t('members.lastAdmin'), { kind: 'error' });
      return;
    }
    void setRole.run({ home, member, role });
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar uid={member.uid} name={member.displayName} photoUrl={member.photoUrl} size={52} />
        <AppText
          size={24}
          weight="extrabold"
          tracking={-0.02}
          accessibilityRole="header"
          style={{ flex: 1 }}
          numberOfLines={2}
        >
          {member.displayName}
        </AppText>
        <PressScale
          bg="well2"
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={{
            height: 48,
            paddingLeft: 10,
            paddingRight: 14,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="close" size={20} strokeWidth={2.4} />
          <AppText size={16} weight="bold">
            {t('common.close')}
          </AppText>
        </PressScale>
      </View>

      <AppText size={16} weight="bold" style={{ marginTop: 16 }}>
        {t('members.roleTitle')}
      </AppText>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={t('members.roleTitle')}
        style={{ marginTop: 8, gap: 8 }}
      >
        {homeRoles.map((role) => {
          const on = role === current;
          return (
            <PressScale
              key={role}
              bg={on ? 'mint' : 'card'}
              border={on ? 'brand' : 'line'}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: setRole.isPending }}
              accessibilityLabel={t(`roles.${role}`)}
              disabled={setRole.isPending}
              onPress={() => pick(role)}
              style={{
                minHeight: 58,
                paddingHorizontal: 16,
                borderRadius: 16,
                borderWidth: 2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AppText size={17} weight="bold" scaled tone={on ? 'mintFg' : 'ink'}>
                {t(`roles.${role}`)}
              </AppText>
              {on && <Icon name="check" size={20} strokeWidth={2.8} color="mintFg" />}
            </PressScale>
          );
        })}
      </View>

      {uid !== me.uid && (
        <View style={{ marginTop: 16 }}>
          <Button
            label={t('members.remove')}
            variant="danger"
            icon="door"
            height={60}
            radius={16}
            fontSize={17}
            loading={remove.isPending}
            onPress={() => setConfirmingRemove(true)}
          />
        </View>
      )}

      <ConfirmDialog
        visible={confirmingRemove}
        title={t('members.removeConfirmTitle', { name: member.displayName })}
        body={t('members.removeConfirmBody')}
        confirmLabel={t('members.remove')}
        destructive
        onCancel={() => setConfirmingRemove(false)}
        onConfirm={() => {
          setConfirmingRemove(false);
          void remove.run({ home, member }).then((ok) => {
            if (ok) {
              onClose();
            }
          });
        }}
      />
    </View>
  );
}
