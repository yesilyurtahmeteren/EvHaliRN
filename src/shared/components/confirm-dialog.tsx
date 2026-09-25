import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';

import { AppText } from './app-text';
import { Button } from './button';
import { Card } from './card';
import { Pop } from './motion';

// Onay penceresi (tasarımda "Hesabı sil için onay diyaloğu eklenmeli";
// kartlarla aynı dil). Dışına dokunmak ya da geri tuşu vazgeçer.
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  destructive = false,
  busy = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        onPress={busy ? undefined : onCancel}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: 'rgba(28,28,24,0.45)',
        }}
      >
        <Pop style={{ width: '100%', maxWidth: 400 }}>
          {/* İç Pressable dokunmayı yutar: kart içine dokunmak kapatmasın. */}
          <Pressable accessibilityRole="alert" onPress={() => undefined}>
            <Card style={{ borderRadius: 28, padding: 22, gap: 12 }}>
              <AppText size={22} weight="extrabold" accessibilityRole="header">
                {title}
              </AppText>
              <AppText size={16} tone="ink2" scaled lineHeight={1.5}>
                {body}
              </AppText>
              <View style={{ marginTop: 8, flexDirection: 'row', gap: 10 }}>
                <Button
                  label={t('common.cancel')}
                  variant="well"
                  height={56}
                  radius={16}
                  fontSize={17}
                  flex
                  disabled={busy}
                  onPress={onCancel}
                />
                <Button
                  label={confirmLabel ?? t('common.confirm')}
                  variant={destructive ? 'danger' : 'primary'}
                  raised={false}
                  height={56}
                  radius={16}
                  fontSize={17}
                  flex
                  loading={busy}
                  onPress={onConfirm}
                />
              </View>
            </Card>
          </Pressable>
        </Pop>
      </Pressable>
    </Modal>
  );
}
