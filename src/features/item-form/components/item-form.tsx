import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CategoriesByName } from '@/features/shopping-list/hooks/use-list-data';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { Chip } from '@/shared/components/chip';
import { LoadingBar } from '@/shared/components/loading-bar';
import { showToast } from '@/shared/components/toast/toast-store';
import { joinNames } from '@/shared/lib/join-names';
import { normalizeName } from '@/shared/lib/normalize-name';
import { itemCategories, itemUnits, type CatalogItem, type ItemCategory } from '@/shared/schemas';
import { fontFamilies, typeScale } from '@/shared/theme';
import { useTextScaleStore } from '@/shared/theme/text-scale-store';
import { useAppTheme } from '@/shared/theme/theme-provider';

import {
  itemFormSchema,
  itemNameMaxLength,
  noteMaxLength,
  quantityMax,
  quantityMin,
  type ItemFormInput,
  type ItemFormValues,
} from '../schemas';

// Kategori çiplerinin süsü (Flutter Strings.categoryEmojis). Ürün adlarına
// emoji eşlenmez: katalog adları serbest metin, güvenilir eşleme yok.
const categoryEmojis: Record<ItemCategory, string> = {
  fruit_vegetable: '🥕',
  dairy_breakfast: '🥛',
  meat_deli: '🥩',
  bakery: '🍞',
  staple: '🌾',
  beverage: '☕',
  snack: '🍪',
  cleaning: '🧼',
  personal_care: '🧴',
  other: '📦',
};

export type ItemFormProps = {
  mode: 'add' | 'edit';
  defaultValues: ItemFormInput;
  homeName: string | null;
  // Bu cihazın sahibi dışındaki üyeler ("X ile anında senkronize olur").
  syncTargetNames: readonly string[];
  suggestions: readonly CatalogItem[];
  categoriesByName: CategoriesByName;
  saving: boolean;
  onSubmit: (values: ItemFormValues) => void;
  onClose: () => void;
};

// Flutter ItemFormSheet ("İhtiyaç Ekle" alt sayfası): listenin üzerine açılan
// sayfa; hızlı ekleme alanının yerine geçmez, yalnızca "Detaylı ekle" ya da
// satır gövdesinden açılır. Boş adla kaydet Flutter'daki gibi bir şey yapmaz.
export function ItemForm({
  mode,
  defaultValues,
  homeName,
  syncTargetNames,
  suggestions,
  categoriesByName,
  saving,
  onSubmit,
  onClose,
}: ItemFormProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const multiplier = useTextScaleStore((s) => s.multiplier);
  const form = useForm<ItemFormInput, unknown, ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  });
  const isEditing = mode === 'edit';

  const submit = form.handleSubmit(onSubmit);
  const applySuggestion = (name: string) => {
    form.setValue('name', name);
    form.setValue('category', categoriesByName.get(normalizeName(name)) ?? null);
  };

  const subtitle = isEditing
    ? t('itemForm.editSubtitle')
    : homeName !== null
      ? t('itemForm.addSubtitle', { home: homeName })
      : undefined;
  const [titleSize, titleLine] = typeScale['title-md'];
  const inputStyle = {
    color: colors['on-surface'],
    fontFamily: fontFamilies.regular,
    fontSize: titleSize * multiplier,
    lineHeight: titleLine * multiplier,
  };

  return (
    <View
      className="max-h-[92%] rounded-t-xl bg-surface-container-low"
      style={{ paddingBottom: insets.bottom }}
    >
      {/* Tutamak + başlık + kapat */}
      <View className="px-lg pb-sm pt-sm">
        <View className="mb-md h-[6px] w-[48px] self-center rounded-sm bg-outline-variant" />
        <View className="flex-row items-start gap-md">
          <View className="flex-1">
            <AppText variant="headline-md" accessibilityRole="header">
              {isEditing ? t('itemForm.editTitle') : t('itemForm.addTitle')}
            </AppText>
            {subtitle !== undefined && (
              <AppText variant="body-sm" tone="on-surface-variant" className="mt-[2px]">
                {subtitle}
              </AppText>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            onPress={onClose}
            className="h-touch w-touch items-center justify-center rounded-full bg-secondary-container active:opacity-80"
          >
            <MaterialIcons name="close" size={22} color={colors['on-secondary-container']} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        className="shrink"
        contentContainerClassName="gap-lg px-lg pb-lg"
      >
        {/* Ad + sesli giriş yer tutucusu */}
        <View className="min-h-[56px] flex-row items-center rounded-md border border-outline-variant bg-surface-container-lowest pl-md">
          <Controller
            control={form.control}
            name="name"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoFocus={!isEditing}
                maxLength={itemNameMaxLength}
                autoCapitalize="sentences"
                placeholder={t('itemForm.nameHint')}
                accessibilityLabel={t('itemForm.nameLabel')}
                placeholderTextColor={colors['on-surface-variant']}
                cursorColor={colors.primary}
                selectionColor={colors.primary}
                className="flex-1 py-sm"
                style={inputStyle}
              />
            )}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('itemForm.voiceInput')}
            onPress={() => showToast(t('itemForm.voiceInputComingSoon'))}
            className="h-touch w-touch items-center justify-center rounded-full"
          >
            <MaterialIcons name="mic-none" size={24} color={colors['on-surface-variant']} />
          </Pressable>
        </View>

        <QuantityUnitCard control={form.control} />

        {suggestions.length > 0 && (
          <View className="gap-sm">
            <View className="flex-row items-center gap-xs">
              <MaterialIcons name="star" size={16} color={colors.secondary} />
              <AppText variant="label-lg">{t('itemForm.quickSuggestionsTitle')}</AppText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerClassName="gap-sm"
            >
              {suggestions.map((entry) => (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  onPress={() => applySuggestion(entry.name)}
                  className="min-h-[36px] justify-center rounded-full bg-surface-container-lowest px-md active:opacity-70"
                >
                  <AppText variant="label-lg">{entry.name}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="gap-sm">
          <AppText variant="label-lg">{t('itemForm.categorySectionTitle')}</AppText>
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                accessibilityRole="radiogroup"
                keyboardShouldPersistTaps="always"
                contentContainerClassName="gap-sm"
              >
                <Chip
                  label={t('itemForm.categoryNone')}
                  selected={field.value === null}
                  onPress={() => field.onChange(null)}
                />
                {itemCategories.map((category) => (
                  <Chip
                    key={category}
                    label={`${categoryEmojis[category]} ${t(`categories.${category}`)}`}
                    accessibilityLabel={t(`categories.${category}`)}
                    selected={field.value === category}
                    onPress={() => field.onChange(category)}
                  />
                ))}
              </ScrollView>
            )}
          />
        </View>

        <View className="gap-xs">
          <AppText variant="label-lg" tone="on-surface-variant">
            {t('itemForm.noteLabel')}
          </AppText>
          <Controller
            control={form.control}
            name="note"
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                maxLength={noteMaxLength}
                returnKeyType="done"
                accessibilityLabel={t('itemForm.noteLabel')}
                cursorColor={colors.primary}
                selectionColor={colors.primary}
                className="min-h-[56px] rounded-md border border-outline-variant bg-surface-container-lowest px-md"
                style={inputStyle}
              />
            )}
          />
        </View>

        <Controller
          control={form.control}
          name="urgent"
          render={({ field }) => (
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel={t('itemForm.urgentLabel')}
              accessibilityHint={t('itemForm.urgentSubtitle')}
              accessibilityState={{ checked: field.value }}
              onPress={() => field.onChange(!field.value)}
              className="min-h-[64px] flex-row items-center gap-md rounded-md border border-outline-variant bg-surface-container-lowest px-md"
            >
              <View className="h-[36px] w-[36px] items-center justify-center rounded-sm bg-secondary-container">
                <MaterialIcons
                  name="local-fire-department"
                  size={20}
                  color={colors['on-secondary-container']}
                />
              </View>
              <View className="flex-1 py-sm">
                <AppText variant="body-lg">{t('itemForm.urgentLabel')}</AppText>
                <AppText variant="body-md" tone="on-surface-variant">
                  {t('itemForm.urgentSubtitle')}
                </AppText>
              </View>
              <Switch
                value={field.value}
                onValueChange={field.onChange}
                importantForAccessibility="no-hide-descendants"
                trackColor={{ false: colors['surface-container-highest'], true: colors.secondary }}
                thumbColor={field.value ? colors['on-secondary'] : colors.outline}
              />
            </Pressable>
          )}
        />
      </ScrollView>

      {/* Alt sabit: Listeye Ekle / Kaydet + senkron ibaresi */}
      <View className="gap-sm border-t border-outline-variant px-lg py-md">
        {saving ? (
          <View className="min-h-[52px] justify-center">
            <LoadingBar />
          </View>
        ) : (
          <Button
            label={isEditing ? t('itemForm.saveButton') : t('itemForm.addButton')}
            icon={isEditing ? 'check' : 'add'}
            fullWidth
            onPress={() => void submit()}
          />
        )}
        {!isEditing && syncTargetNames.length > 0 && (
          <AppText variant="body-sm" tone="on-surface-variant" className="text-center">
            {t('itemForm.syncCaption', { names: joinNames(syncTargetNames, t('common.and')) })}
          </AppText>
        )}
      </View>
    </View>
  );
}

// "Miktar & Birim": −/+ sayaç (1-99) ve birim seçimi. Flutter'da birim bir
// açılır menüydü; burada aynı kartta çipler (RN'de yerleşik açılır menü yok).
function QuantityUnitCard({
  control,
}: {
  control: ReturnType<typeof useForm<ItemFormInput, unknown, ItemFormValues>>['control'];
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-sm rounded-md border border-outline-variant bg-surface-container-lowest px-md py-sm">
      <View className="flex-row items-center gap-sm">
        <AppText variant="label-md" numberOfLines={1} className="flex-1">
          {t('itemForm.quantityUnitLabel')}
        </AppText>
        <Controller
          control={control}
          name="quantity"
          render={({ field }) => (
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={t('itemForm.quantityLabel')}
              accessibilityValue={{ min: quantityMin, max: quantityMax, now: field.value }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === 'increment' && field.value < quantityMax) {
                  field.onChange(field.value + 1);
                } else if (
                  event.nativeEvent.actionName === 'decrement' &&
                  field.value > quantityMin
                ) {
                  field.onChange(field.value - 1);
                }
              }}
              className="flex-row items-center rounded-sm bg-surface-container-high p-[2px]"
            >
              <StepperButton
                icon="remove"
                label={t('itemForm.decrease')}
                disabled={field.value <= quantityMin}
                onPress={() => field.onChange(field.value - 1)}
              />
              <AppText variant="title-md" className="w-[32px] text-center">
                {String(field.value)}
              </AppText>
              <StepperButton
                icon="add"
                label={t('itemForm.increase')}
                disabled={field.value >= quantityMax}
                onPress={() => field.onChange(field.value + 1)}
              />
            </View>
          )}
        />
      </View>
      <Controller
        control={control}
        name="unit"
        render={({ field }) => (
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-sm">
            {itemUnits.map((unit) => (
              <Chip
                key={unit}
                label={t(`units.${unit}`)}
                selected={field.value === unit}
                onPress={() => field.onChange(unit)}
                className="min-h-[36px]"
              />
            ))}
          </View>
        )}
      />
    </View>
  );
}

function StepperButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      className={`h-[36px] w-[36px] items-center justify-center rounded-xs bg-surface-container-lowest ${
        disabled ? 'opacity-40' : 'active:opacity-70'
      }`}
    >
      <MaterialIcons name={icon} size={16} color={colors.primary} />
    </Pressable>
  );
}
