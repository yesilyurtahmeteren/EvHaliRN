import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/shared/components/app-text';
import { Checkbox } from '@/shared/components/checkbox';
import { MemberAvatar } from '@/shared/components/member-avatar';
import type { AppUser, Item } from '@/shared/schemas';
import { AppMotion } from '@/shared/theme';
import { useAppTheme } from '@/shared/theme/theme-provider';

// Flutter widgets/item_tile.dart: solda yuvarlak onay kutusu, ad (alındıysa
// üstü çizili), acil ve miktar rozetleri, "Ekleyen/Alan" alt satırı, sağda
// kişinin baş harfi. Kutuya dokunmak işaretler; satırın geri kalanı ürünü
// düzenlemeye açar.
export function ItemTile({
  item,
  isBought,
  isFadingOut = false,
  members,
  onToggle,
  onOpenDetail,
}: {
  item: Item;
  isBought: boolean;
  isFadingOut?: boolean;
  members: ReadonlyMap<string, AppUser>;
  onToggle: () => void;
  onOpenDetail: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(isFadingOut ? 0 : 1, {
      duration: AppMotion.itemFadeOutDurationMs,
    });
  }, [isFadingOut, opacity]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // Satırın "sahibi": alındıysa alan, değilse ekleyen.
  const ownerUid = isBought ? item.boughtBy : item.addedBy;
  const owner = ownerUid !== null ? members.get(ownerUid) : undefined;
  const ownerName = owner?.displayName ?? '';
  const subtitle =
    ownerName.length === 0
      ? undefined
      : isBought
        ? t('list.boughtByLabel', { name: ownerName })
        : t('list.addedByLabel', { name: ownerName });
  const showQuantity = item.quantity > 1 || item.unit !== 'adet';

  return (
    // Onay kutusu ve detay alanı ayrı dokunma/erişilebilirlik öğeleri: satırın
    // tamamı tek düğme olsaydı ekran okuyucu kutuya ulaşamazdı.
    <Animated.View style={fadeStyle} className="min-h-row flex-row items-center pl-sm">
      <Checkbox
        checked={isBought}
        onPress={onToggle}
        accessibilityLabel={t('list.checkItemLabel', { name: item.name })}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityHint={t('list.openDetailHint')}
        onPress={onOpenDetail}
        className="min-h-row flex-1 flex-row items-center gap-sm pl-sm pr-lg active:bg-surface-container-low"
      >
        <View className="flex-1 py-sm">
          <View className="flex-row flex-wrap items-center gap-sm">
            <AppText
              variant="title-md"
              tone={isBought ? 'bought-strikethrough' : 'on-surface'}
              style={isBought ? { textDecorationLine: 'line-through' } : undefined}
              className="shrink"
            >
              {item.name}
            </AppText>
            {item.urgent && !isBought && (
              <View className="flex-row items-center gap-[2px] rounded-sm bg-secondary-container px-sm py-[2px]">
                <MaterialIcons
                  name="local-fire-department"
                  size={12}
                  color={colors['on-secondary-container']}
                />
                <AppText variant="label-sm" tone="on-secondary-container">
                  {t('list.urgentBadge')}
                </AppText>
              </View>
            )}
            {showQuantity && (
              <View className="rounded-sm bg-tertiary-container px-sm py-[2px]">
                <AppText variant="label-sm" tone="on-tertiary-container">
                  {t('list.quantityBadge', {
                    quantity: item.quantity,
                    unit: t(`units.${item.unit}`),
                  })}
                </AppText>
              </View>
            )}
          </View>
          {subtitle !== undefined && (
            <AppText variant="body-sm" tone="on-surface-variant">
              {subtitle}
            </AppText>
          )}
        </View>
        {ownerUid !== null && ownerName.length > 0 && (
          // Flutter burada fotoğraf değil, üye rengi üzerinde baş harf gösteriyor.
          <MemberAvatar uid={ownerUid} displayName={ownerName} photoUrl={null} size={28} />
        )}
      </Pressable>
    </Animated.View>
  );
}
