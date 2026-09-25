import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Pressable, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { Card } from '@/shared/components/card';
import { Pop } from '@/shared/components/motion';
import { TextField } from '@/shared/components/text-field';
import { homeNameMaxLength, homeNameSchema } from '@/shared/schemas';

// Ev adını değiştirme penceresi (yalnızca yönetici). Boş ad kaydedilmez,
// alan sallanır.
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
  const [name, setName] = useState(currentName);
  const [shake, setShake] = useState(0);

  const submit = () => {
    const parsed = homeNameSchema.safeParse(name);
    if (!parsed.success) {
      setShake((k) => k + 1);
      return;
    }
    onSave(parsed.data);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior="height" style={{ flex: 1 }}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onCancel}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: 'rgba(28,28,24,0.45)',
          }}
        >
          <Pop style={{ width: '100%', maxWidth: 400 }}>
            <Pressable onPress={() => undefined}>
              <Card style={{ borderRadius: 28, padding: 22, gap: 12 }}>
                <AppText size={22} weight="extrabold" accessibilityRole="header">
                  {t('dashboard.homeNameLabel')}
                </AppText>
                <TextField
                  value={name}
                  onChangeText={setName}
                  accessibilityLabel={t('dashboard.homeNameLabel')}
                  maxLength={homeNameMaxLength}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={submit}
                  shakeKey={shake}
                />
                <View style={{ marginTop: 4, flexDirection: 'row', gap: 10 }}>
                  <Button
                    label={t('common.cancel')}
                    variant="well"
                    height={56}
                    radius={16}
                    fontSize={17}
                    flex
                    onPress={onCancel}
                  />
                  <Button
                    label={t('common.save')}
                    raised={false}
                    height={56}
                    radius={16}
                    fontSize={17}
                    flex
                    onPress={submit}
                  />
                </View>
              </Card>
            </Pressable>
          </Pop>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
