import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';

import { useAppTheme } from '@/shared/theme/theme-provider';

import { AppText } from './app-text';
import { Button } from './button';

// Flutter AlertDialog (Vazgeç / Onayla) karşılığı. Evden ayrılma ve davet
// kodu yenileme onayında kullanılır. Dışına dokunmak ya da geri tuşu vazgeçer.
// Modal ayrı bir native pencere; renkler NativeWind CSS değişkeni yerine
// doğrudan temadan verilir.
export function ConfirmDialog({
  visible,
  title,
  body,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        onPress={onCancel}
        className="flex-1 items-center justify-center p-xl"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      >
        {/* İç Pressable dokunmayı yutar: kart içine dokunmak kapatmasın. */}
        <Pressable
          accessibilityRole="alert"
          onPress={() => undefined}
          className="w-full max-w-[400px] gap-md rounded-xl p-lg"
          style={{ backgroundColor: colors['surface-container-high'] }}
        >
          <AppText variant="headline-sm" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="body-md" tone="on-surface-variant">
            {body}
          </AppText>
          <View className="mt-sm flex-row justify-end gap-sm">
            <Button label={t('common.cancel')} variant="text" onPress={onCancel} />
            <Button label={t('common.confirm')} onPress={onConfirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
