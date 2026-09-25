// Liste ekranının küçük parçaları (Flutter list_screen.dart içindeki
// _CategoryFilterRow, _CategoryHeader, _OfflineBanner, _BoughtSection başlığı).
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/shared/components/app-text';
import { Chip } from '@/shared/components/chip';
import type { ItemCategory } from '@/shared/schemas';
import { useAppTheme } from '@/shared/theme/theme-provider';

import type { ItemGroup } from '../lib/group-items';

// Yalnızca birden fazla grup varken gösterilir. null = "Tümü".
export function CategoryFilterRow({
  groups,
  selected,
  onSelect,
}: {
  groups: readonly ItemGroup[];
  selected: ItemCategory | null;
  onSelect: (category: ItemCategory | null) => void;
}) {
  const { t } = useTranslation();
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      className="max-h-[52px] grow-0"
      contentContainerClassName="items-center gap-sm px-md py-xs"
    >
      <Chip
        label={t('list.categoryFilterAll', { count: total })}
        selected={selected === null}
        onPress={() => onSelect(null)}
      />
      {groups.map((group) => (
        <Chip
          key={group.category}
          label={t(`categories.${group.category}`)}
          selected={selected === group.category}
          onPress={() => onSelect(group.category)}
        />
      ))}
    </ScrollView>
  );
}

export function CategoryHeader({ category, count }: { category: ItemCategory; count: number }) {
  const { t } = useTranslation();
  return (
    <AppText variant="title-lg" accessibilityRole="header" className="px-lg pb-sm pt-md">
      {`${t(`categories.${category}`)} · ${count}`}
    </AppText>
  );
}

// Veri yerel önbellekten geliyor: değişiklikler bağlanınca gönderilecek.
export function OfflineBanner() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View
      accessibilityLiveRegion="polite"
      className="flex-row items-center gap-sm bg-secondary-container px-lg py-sm"
    >
      <MaterialIcons name="cloud-off" size={18} color={colors['on-secondary-container']} />
      <AppText variant="body-sm" tone="on-secondary-container" className="flex-1">
        {t('list.offlineBanner')}
      </AppText>
    </View>
  );
}

// Flutter ExpansionTile: varsayılan kapalı, "Alınanlar (n)".
export function BoughtHeader({
  count,
  expanded,
  onToggle,
}: {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const title = t('list.boughtSectionTitle', { count });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ expanded }}
      onPress={onToggle}
      className="min-h-[56px] flex-row items-center px-lg active:bg-surface-container-low"
    >
      <AppText variant="title-md" className="flex-1">
        {title}
      </AppText>
      <MaterialIcons
        name={expanded ? 'expand-less' : 'expand-more'}
        size={24}
        color={colors['on-surface-variant']}
      />
    </Pressable>
  );
}
