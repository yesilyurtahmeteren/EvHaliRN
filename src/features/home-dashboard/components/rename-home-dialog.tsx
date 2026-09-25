import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';
import { z } from 'zod';

import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { TextField } from '@/shared/components/text-field';
import { homeNameMaxLength, homeNameSchema } from '@/shared/schemas';
import { useAppTheme } from '@/shared/theme/theme-provider';

const renameSchema = z.object({ name: homeNameSchema });

// Flutter _handleEditName AlertDialog'u: mevcut adla dolu alan, Vazgeç /
// Kaydet. Boş ad Flutter'daki gibi kaydedilmez, pencere yalnızca kapanır.
// Pencere her açılışta yeniden bağlanır (key), böylece güncel adla başlar.
export function RenameHomeDialog({
  currentName,
  onCancel,
  onSave,
}: {
  currentName: string;
  onCancel: () => void;
  onSave: (name: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const form = useForm<z.input<typeof renameSchema>, unknown, { name: string }>({
    resolver: zodResolver(renameSchema),
    defaultValues: { name: currentName },
  });

  const submit = form.handleSubmit(
    ({ name }) => onSave(name),
    () => onCancel(),
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior="height" className="flex-1">
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onCancel}
          className="flex-1 items-center justify-center p-xl"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <Pressable
            onPress={() => undefined}
            className="w-full max-w-[400px] gap-md rounded-xl p-lg"
            style={{ backgroundColor: colors['surface-container-high'] }}
          >
            <AppText variant="headline-sm" accessibilityRole="header">
              {t('dashboard.homeNameLabel')}
            </AppText>
            <Controller
              control={form.control}
              name="name"
              render={({ field }) => (
                <TextField
                  accessibilityLabel={t('dashboard.homeNameLabel')}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={homeNameMaxLength}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => void submit()}
                />
              )}
            />
            <View className="flex-row justify-end gap-sm">
              <Button label={t('common.cancel')} variant="text" onPress={onCancel} />
              <Button label={t('dashboard.saveHomeName')} onPress={() => void submit()} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
