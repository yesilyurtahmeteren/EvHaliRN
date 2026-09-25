import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { Card } from '@/shared/components/card';
import { Checkbox } from '@/shared/components/checkbox';
import { Icon } from '@/shared/components/icon';
import { FlashRing } from '@/shared/components/motion';
import type { AppUser, Item } from '@/shared/schemas';
import { Ease } from '@/shared/theme';

// Main.dc.html ürün satırı (min 76 px, radius 20): 56 px alanda 38 px onay
// kutusu, ad 18/700 (en fazla 2 satır), alt satır "2 adet · Zeynep ekledi",
// gerekirse sağda Acil hapı. İşaretlenirken satır %55 opaklığa iner ve
// 10 px sağa kayar, ad üstü çizilir. Satırın geri kalanına dokunmak ürünü
// düzenlemeye açar (misafirde kapalı).
export function ItemRow({
  item,
  checking,
  flashKey,
  members,
  readOnly,
  onToggle,
  onEdit,
}: {
  item: Item;
  checking: boolean;
  flashKey: number | null;
  members: ReadonlyMap<string, AppUser>;
  readOnly: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const leave = useSharedValue(checking ? 1 : 0);
  useEffect(() => {
    leave.value = withTiming(checking ? 1 : 0, { duration: 350, easing: Ease.ease });
  }, [checking, leave]);
  const leaveStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.45 * leave.value,
    transform: [{ translateX: 10 * leave.value }],
  }));

  const adder = members.get(item.addedBy)?.displayName.split(' ')[0] ?? '';
  const showAmount = item.quantity > 1 || item.unit !== 'adet';
  const sub = [
    showAmount
      ? t('list.amount', { quantity: item.quantity, unit: t(`unitsShort.${item.unit}`) })
      : '',
    adder.length > 0 ? t('list.addedBy', { name: adder }) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Animated.View style={leaveStyle}>
      <Card
        shadow="row"
        style={{
          minHeight: 76,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingTop: 10,
          paddingBottom: 10,
          paddingRight: 16,
          paddingLeft: 8,
          borderRadius: 20,
        }}
      >
        <Checkbox
          checked={checking}
          disabled={readOnly}
          onPress={onToggle}
          accessibilityLabel={
            checking
              ? t('list.uncheckLabel', { name: item.name })
              : t('list.checkLabel', { name: item.name })
          }
        />
        <Pressable
          accessibilityRole="button"
          accessibilityHint={readOnly ? undefined : t('list.editHint')}
          disabled={readOnly}
          onPress={onEdit}
          style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText
              size={18}
              weight="bold"
              lineHeight={1.3}
              scaled
              numberOfLines={2}
              strike={checking}
            >
              {item.name}
            </AppText>
            {sub.length > 0 && (
              <AppText size={15} tone="ink2" scaled style={{ marginTop: 4 }}>
                {sub}
              </AppText>
            )}
          </View>
          {item.urgent && (
            <Box
              bg="peach"
              style={{
                flexShrink: 0,
                height: 30,
                paddingHorizontal: 10,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Icon name="flame" size={14} color="peachFg" />
              <AppText size={14} weight="extrabold" tone="peachFg">
                {t('list.urgent')}
              </AppText>
            </Box>
          )}
        </Pressable>
        {flashKey !== null && <FlashRing key={flashKey} active radius={20} />}
      </Card>
    </Animated.View>
  );
}
