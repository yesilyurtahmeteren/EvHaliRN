import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { Button } from '@/shared/components/button';
import { Icon } from '@/shared/components/icon';
import { Pop } from '@/shared/components/motion';
import { PressScale } from '@/shared/components/press-scale';
import { TextField } from '@/shared/components/text-field';
import { Toggle } from '@/shared/components/toggle';
import { categoryLook } from '@/shared/lib/category-look';
import { itemCategories, itemUnits, type ItemCategory, type ItemUnit } from '@/shared/schemas';
import { Durations, Ease, fixedColors } from '@/shared/theme';

import { useVoiceInput } from '../hooks/use-voice-input';
import {
  itemFormSchema,
  itemNameMaxLength,
  quantityMax,
  quantityMin,
  type ItemFormValues,
} from '../schemas';

// Main.dc.html hızlı seçim hapları: ad + bölüm.
const quickPicks: readonly {
  key: 'bread' | 'milk' | 'eggs' | 'napkin' | 'detergent' | 'shampoo';
  category: ItemCategory;
}[] = [
  { key: 'bread', category: 'food' },
  { key: 'milk', category: 'food' },
  { key: 'eggs', category: 'food' },
  { key: 'napkin', category: 'clean' },
  { key: 'detergent', category: 'clean' },
  { key: 'shampoo', category: 'care' },
];

export type ItemFormProps = {
  mode: 'add' | 'edit';
  initialValues: ItemFormValues;
  saving?: boolean;
  onSubmit: (values: ItemFormValues) => void;
  onClose: () => void;
  onDelete?: () => void;
};

// "İhtiyaç Ekle" alt sayfasının içeriği (HANDOFF §2.3). Ad boşsa alan
// 450 ms sallanır ve hiçbir şey eklenmez.
export function ItemForm({
  mode,
  initialValues,
  saving = false,
  onSubmit,
  onClose,
  onDelete,
}: ItemFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<ItemFormValues>(initialValues);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const set = (patch: Partial<ItemFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const voice = useVoiceInput((spoken) =>
    set({
      name: spoken.name.slice(0, itemNameMaxLength),
      ...(spoken.quantity === undefined ? {} : { quantity: spoken.quantity }),
      ...(spoken.unit === undefined ? {} : { unit: spoken.unit }),
    }),
  );

  const submit = () => {
    const parsed = itemFormSchema.safeParse(values);
    if (!parsed.success) {
      setShakeKey((k) => k + 1);
      return;
    }
    onSubmit(parsed.data);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText size={26} weight="extrabold" tracking={-0.02} accessibilityRole="header">
          {mode === 'add' ? t('itemForm.addTitle') : t('itemForm.editTitle')}
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

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        // Birim listesi açıkken içeriğin altında taşmasın diye yer açılır.
        contentContainerStyle={{ paddingBottom: unitsOpen ? 90 : 2 }}
      >
        <AppText size={16} weight="bold" style={{ marginTop: 14 }} nativeID="item-name-label">
          {t('itemForm.nameLabel')}
        </AppText>
        <View style={{ marginTop: 8 }}>
          <TextField
            value={values.name}
            onChangeText={(name) => set({ name })}
            placeholder={t('itemForm.namePlaceholder')}
            accessibilityLabel={t('itemForm.nameLabel')}
            accessibilityLabelledBy="item-name-label"
            maxLength={itemNameMaxLength}
            autoCapitalize="sentences"
            autoFocus={mode === 'add'}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={submit}
            shakeKey={shakeKey}
            trailing={
              <PressScale
                bg={voice.listening ? 'btn' : 'mint'}
                accessibilityRole="button"
                accessibilityLabel={voice.listening ? t('itemForm.voiceStop') : t('itemForm.voice')}
                accessibilityState={{ busy: voice.listening }}
                onPress={() => void voice.toggle()}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name="mic"
                  size={24}
                  strokeWidth={2}
                  color={voice.listening ? fixedColors.onBtn : 'mintFg'}
                />
              </PressScale>
            }
          />
        </View>
        {voice.listening && (
          <AppText
            size={15}
            weight="semibold"
            tone="brand"
            accessibilityLiveRegion="polite"
            style={{ marginTop: 6 }}
          >
            {t('itemForm.voiceListening')}
          </AppText>
        )}

        {mode === 'add' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            style={{ marginTop: 10, marginHorizontal: -20 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {quickPicks.map((pick) => {
              const label = t(`itemForm.quickPicks.${pick.key}`);
              return (
                <PressScale
                  key={pick.key}
                  bg="card"
                  border="line"
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  onPress={() => set({ name: label, category: pick.category })}
                  style={{
                    height: 44,
                    paddingHorizontal: 16,
                    borderRadius: 999,
                    borderWidth: 1.5,
                    justifyContent: 'center',
                  }}
                >
                  <AppText size={16} weight="semibold">
                    {label}
                  </AppText>
                </PressScale>
              );
            })}
          </ScrollView>
        )}

        <AppText size={16} weight="bold" style={{ marginTop: 16 }}>
          {t('itemForm.amountLabel')}
        </AppText>
        <View
          style={{
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            zIndex: 10,
          }}
        >
          <Stepper value={values.quantity} onChange={(quantity) => set({ quantity })} />
          <UnitPicker
            value={values.unit}
            open={unitsOpen}
            onToggle={() => setUnitsOpen((o) => !o)}
            onPick={(unit) => {
              set({ unit });
              setUnitsOpen(false);
            }}
          />
        </View>

        <AppText size={16} weight="bold" style={{ marginTop: 16 }}>
          {t('itemForm.categoryLabel')}
        </AppText>
        <View
          accessibilityRole="radiogroup"
          accessibilityLabel={t('itemForm.categoryLabel')}
          style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
        >
          {itemCategories.map((category) => {
            const on = values.category === category;
            const look = categoryLook[category];
            return (
              <PressScale
                key={category}
                bg={on ? 'mint' : 'card'}
                border={on ? 'brand' : 'line'}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t(`categories.${category}`)}
                onPress={() => set({ category })}
                style={{
                  width: '48.8%',
                  flexGrow: 1,
                  height: 58,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  borderWidth: 2,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Box
                  bg={look.bg}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={look.icon} size={20} strokeWidth={2} color={look.fg} />
                </Box>
                <AppText size={17} weight="bold" numberOfLines={1} style={{ flex: 1 }}>
                  {t(`categories.${category}`)}
                </AppText>
              </PressScale>
            );
          })}
        </View>

        <Box
          bg="card"
          border="line"
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 12,
            borderRadius: 20,
            borderWidth: 1,
          }}
        >
          <Box
            bg="peach"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="flame" size={20} color={fixedColors.urgentOn} />
          </Box>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText size={16} weight="bold">
              {t('itemForm.urgentTitle')}
            </AppText>
            <AppText size={14} tone="ink2">
              {t('itemForm.urgentSubtitle')}
            </AppText>
          </View>
          <Toggle
            small
            value={values.urgent}
            onValueChange={(urgent) => set({ urgent })}
            onColor={fixedColors.urgentOn}
            accessibilityLabel={t('itemForm.urgentSwitch')}
          />
        </Box>
      </ScrollView>

      <View style={{ marginTop: 16 }}>
        <Button
          label={mode === 'add' ? t('itemForm.addButton') : t('itemForm.saveButton')}
          icon={mode === 'add' ? 'plus' : 'check'}
          iconStrokeWidth={2.8}
          height={62}
          weight="extrabold"
          loading={saving}
          onPress={submit}
        />
        {onDelete !== undefined && (
          <View style={{ marginTop: 10 }}>
            <Button
              label={t('itemForm.deleteButton')}
              variant="danger"
              icon="close"
              height={52}
              radius={16}
              fontSize={17}
              disabled={saving}
              onPress={onDelete}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// − / sayı / +; düğmeler 52 px, sayı 22/800, 1-99. Sayı ekran okuyucuya
// değiştikçe okunur (aria-live).
function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const { t } = useTranslation();
  const step = (delta: number) =>
    onChange(Math.min(quantityMax, Math.max(quantityMin, value + delta)));
  const button = (icon: 'minus' | 'plus', label: string, delta: number, disabled: boolean) => (
    <PressScale
      bg="card"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => step(delta)}
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon name={icon} size={22} strokeWidth={2.6} />
    </PressScale>
  );
  return (
    <Box
      bg="well2"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 18 }}
    >
      {button('minus', t('itemForm.decrease'), -1, value <= quantityMin)}
      <AppText
        size={22}
        weight="extrabold"
        accessibilityLabel={`${t('itemForm.quantity')}: ${value}`}
        accessibilityLiveRegion="polite"
        style={{ width: 44, textAlign: 'center' }}
      >
        {String(value)}
      </AppText>
      {button('plus', t('itemForm.increase'), 1, value >= quantityMax)}
    </Box>
  );
}

// Birim açılır listesi (role="listbox"): düğmenin altında, sağa hizalı,
// 220 px; dropIn 280 ms (translateY -8, scale .94 -> 1, köken sağ üst).
function UnitPicker({
  value,
  open,
  onToggle,
  onPick,
}: {
  value: ItemUnit;
  open: boolean;
  onToggle: () => void;
  onPick: (unit: ItemUnit) => void;
}) {
  const { t } = useTranslation();
  const turn = useSharedValue(open ? 1 : 0);
  const drop = useSharedValue(0);
  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, { duration: Durations.chevron, easing: Ease.easeOut });
    if (open) {
      drop.value = 0;
      drop.value = withTiming(1, { duration: Durations.dropdown, easing: Ease.easeOut });
    }
  }, [drop, open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));
  const dropStyle = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [{ translateY: -8 * (1 - drop.value) }, { scale: 0.94 + 0.06 * drop.value }],
  }));

  return (
    <View style={{ flex: 1, minWidth: 0 }}>
      <PressScale
        bg="card"
        border={open ? 'brand' : 'reed'}
        accessibilityRole="button"
        accessibilityLabel={`${t('itemForm.unitLabel')}: ${t(`units.${value}`)}`}
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={{
          height: 60,
          paddingLeft: 16,
          paddingRight: 14,
          borderWidth: 2,
          borderRadius: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppText size={18} weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
          {t(`units.${value}`)}
        </AppText>
        <Animated.View style={chevron}>
          <Icon name="chevronDown" size={22} strokeWidth={2.4} />
        </Animated.View>
      </PressScale>
      {open && (
        <Animated.View
          style={[
            { position: 'absolute', right: 0, top: 68, width: 220, transformOrigin: 'top right' },
            dropStyle,
          ]}
        >
          <Box
            bg="card"
            border="line"
            accessibilityRole="list"
            accessibilityLabel={t('itemForm.unitLabel')}
            style={{
              padding: 6,
              borderRadius: 20,
              borderWidth: 1,
              boxShadow: '0px 18px 40px -10px rgba(0,0,0,0.3)',
              elevation: 12,
            }}
          >
            {itemUnits.map((unit) => {
              const on = unit === value;
              return (
                <Pressable
                  key={unit}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on, checked: on }}
                  accessibilityLabel={t(`units.${unit}`)}
                  onPress={() => onPick(unit)}
                >
                  <Box
                    bg={on ? 'mint' : 'transparent'}
                    style={{
                      height: 52,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <AppText
                      size={17}
                      weight={on ? 'extrabold' : 'semibold'}
                      tone={on ? 'mintFg' : 'ink'}
                    >
                      {t(`units.${unit}`)}
                    </AppText>
                    {on && (
                      <Pop>
                        <Icon name="check" size={20} strokeWidth={2.8} color="mintFg" />
                      </Pop>
                    )}
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        </Animated.View>
      )}
    </View>
  );
}
