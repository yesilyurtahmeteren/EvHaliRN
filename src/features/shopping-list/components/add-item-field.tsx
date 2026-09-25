import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { fontFamilies, typeScale } from '@/shared/theme';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';
import { useAppTheme } from '@/shared/theme/theme-provider';

const nameMaxLength = 60;

// Flutter widgets/add_item_field.dart — uygulamanın başarı ölçütü burada:
// "süt bitti" 3 saniyede. Ekranın ALTINDA sabit (tek elle, başparmakla).
// Enter/+ ekler, alanı temizler ve klavyeyi KAPATMAZ; arka arkaya 5 ürün
// akıcı girilebilmeli. Ekleme beklenmez (iyimser), hata toast ile gelir.
export function AddItemField({
  onSubmit,
  onOpenDetail,
}: {
  onSubmit: (name: string) => void;
  // "Detaylı ekle": alandaki yazı (varsa) forma ad olarak taşınır.
  onOpenDetail: (initialName: string) => void;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const multiplier = useTextScaleStore((s) => s.multiplier);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [fontSize, lineHeight] = typeScale['body-lg'];

  const submit = () => {
    const name = text.trim();
    if (name.length === 0) {
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit(name);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <View className="px-md pb-md pt-sm">
      <View className="min-h-[56px] flex-row items-center rounded-xl bg-surface-container-low pl-lg pr-xs">
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          onSubmitEditing={submit}
          submitBehavior="submit"
          returnKeyType="done"
          maxLength={nameMaxLength}
          placeholder={t('list.addItemHint')}
          accessibilityLabel={t('list.addItemHint')}
          placeholderTextColor={colors['on-surface-variant']}
          cursorColor={colors.primary}
          selectionColor={colors.primary}
          className="flex-1 py-sm"
          style={{
            color: colors['on-surface'],
            fontFamily: fontFamilies.regular,
            fontSize: fontSize * multiplier,
            lineHeight: lineHeight * multiplier,
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('list.addItemDetail')}
          onPress={() => onOpenDetail(text.trim())}
          className="h-touch w-touch items-center justify-center rounded-full active:bg-surface-container-high"
        >
          <MaterialIcons name="tune" size={24} color={colors['on-surface-variant']} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('list.addItem')}
          onPress={submit}
          className="ml-xs h-[44px] w-[44px] items-center justify-center rounded-full bg-primary active:opacity-80"
        >
          <MaterialIcons name="add" size={24} color={colors['on-primary']} />
        </Pressable>
      </View>
    </View>
  );
}
