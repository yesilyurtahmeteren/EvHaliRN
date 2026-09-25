import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState, ErrorView, LoadingScreen } from '@/shared/components/states';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import { normalizeName } from '@/shared/lib/normalize-name';
import type { AppUser, Item, ItemCategory } from '@/shared/schemas';

import { cleanupOldBoughtItems } from '../api';
import { useAddItem } from '../hooks/use-add-item';
import { useCheckOff } from '../hooks/use-check-off';
import { useCatalogCategories, useFrozenTopCatalog } from '../hooks/use-list-data';
import { groupByCategory, withLeavingItems } from '../lib/group-items';
import { AddItemField } from './add-item-field';
import { ItemTile } from './item-tile';
import { BoughtHeader, CategoryFilterRow, CategoryHeader, OfflineBanner } from './list-sections';
import { QuickAddBar } from './quick-add-bar';

type Row =
  | { kind: 'header'; key: string; category: ItemCategory; count: number }
  | { kind: 'item'; key: string; item: Item }
  | { kind: 'empty'; key: string }
  | { kind: 'bought-header'; key: string; count: number }
  | { kind: 'bought-item'; key: string; item: Item };

const emptyMembers: ReadonlyMap<string, AppUser> = new Map();

// Flutter screens/list_screen.dart — uygulamanın kalbi. Yukarıdan aşağı:
// çevrimdışı şeridi, kategori filtresi, gruplu liste + Alınanlar, sık
// alınanlar çipleri, altta sabit ekleme alanı.
export function ListScreen() {
  const { t } = useTranslation();
  const homeId = useRequiredHomeId();
  const needed = useNeededItems(homeId);
  const bought = useBoughtItems(homeId);
  const members = useMembers(homeId);
  const categories = useCatalogCategories(homeId);
  const topCatalog = useFrozenTopCatalog(homeId);
  const addItem = useAddItem(homeId);
  const { leaving, fading, toggle, restore } = useCheckOff(homeId);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [boughtExpanded, setBoughtExpanded] = useState(false);

  // Açılışta 7 günden eski alınanlar temizlenir. Arka plan bakımı: başarısız
  // olursa bir sonraki açılışta tekrar denenir, kullanıcıya hata gösterilmez.
  useEffect(() => {
    cleanupOldBoughtItems(homeId).catch((error: unknown) => {
      if (__DEV__) {
        console.warn('cleanupOldBoughtItems failed', error);
      }
    });
  }, [homeId]);

  const memberMap = useMemo(
    () =>
      members.data === undefined
        ? emptyMembers
        : new Map(members.data.map((member) => [member.uid, member])),
    [members.data],
  );

  const neededItems = needed.data?.items;
  const displayItems = useMemo(
    () => withLeavingItems(neededItems ?? [], leaving),
    [neededItems, leaving],
  );
  const neededNames = useMemo(
    () => new Set((neededItems ?? []).map((item) => normalizeName(item.name))),
    [neededItems],
  );
  const allGroups = useMemo(
    () => groupByCategory(displayItems, categories.data ?? new Map()),
    [displayItems, categories.data],
  );
  // Seçili kategori listeden kalkarsa (son ürünü alındı) "Tümü"ye dönülür.
  const activeCategory =
    selectedCategory !== null && allGroups.some((g) => g.category === selectedCategory)
      ? selectedCategory
      : null;

  const boughtItems = bought.data?.items;
  const rows = useMemo<Row[]>(() => {
    const result: Row[] = [];
    if (displayItems.length === 0) {
      result.push({ kind: 'empty', key: 'empty' });
    } else {
      for (const group of allGroups) {
        if (activeCategory !== null && group.category !== activeCategory) {
          continue;
        }
        result.push({
          kind: 'header',
          key: `header-${group.category}`,
          category: group.category,
          count: group.items.length,
        });
        group.items.forEach((item) => result.push({ kind: 'item', key: `item-${item.id}`, item }));
      }
    }
    // Alınanlar yalnızca "Tümü" görünümünde (Flutter ile aynı).
    if (activeCategory === null && boughtItems !== undefined && boughtItems.length > 0) {
      result.push({ kind: 'bought-header', key: 'bought-header', count: boughtItems.length });
      if (boughtExpanded) {
        boughtItems.forEach((item) =>
          result.push({ kind: 'bought-item', key: `bought-${item.id}`, item }),
        );
      }
    }
    return result;
  }, [displayItems.length, allGroups, activeCategory, boughtItems, boughtExpanded]);

  const openDetail = (item: Item) =>
    router.push({ pathname: '/item-form', params: { itemId: item.id } });
  const openAddDetail = (initialName: string) =>
    router.push({ pathname: '/item-form', params: { initialName } });
  const add = (name: string) => void addItem.run({ name });

  const renderRow = ({ item: row }: { item: Row }) => {
    switch (row.kind) {
      case 'header':
        return <CategoryHeader category={row.category} count={row.count} />;
      case 'item':
        return (
          <ItemTile
            item={row.item}
            isBought={leaving.has(row.item.id)}
            isFadingOut={fading.has(row.item.id)}
            members={memberMap}
            onToggle={() => toggle(row.item)}
            onOpenDetail={() => openDetail(row.item)}
          />
        );
      case 'empty':
        return <EmptyState icon="shopping-bag" title={t('list.emptyListMessage')} />;
      case 'bought-header':
        return (
          <BoughtHeader
            count={row.count}
            expanded={boughtExpanded}
            onToggle={() => setBoughtExpanded((value) => !value)}
          />
        );
      case 'bought-item':
        return (
          <ItemTile
            item={row.item}
            isBought
            members={memberMap}
            onToggle={() => restore(row.item)}
            onOpenDetail={() => openDetail(row.item)}
          />
        );
    }
  };

  let body;
  if (needed.isPending) {
    body = <LoadingScreen />;
  } else if (needed.isError) {
    body = <ErrorView message={t('errors.generic')} onRetry={() => void needed.refetch()} />;
  } else {
    body = (
      <FlashList
        data={rows}
        renderItem={renderRow}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.kind}
        // Solma/işaretleme durumu satır verisinde değil; değişince yeniden çiz.
        extraData={{ leaving, fading, memberMap, boughtExpanded }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 8 }}
      />
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {needed.data?.fromCache === true && <OfflineBanner />}
      {allGroups.length > 1 && (
        <CategoryFilterRow
          groups={allGroups}
          selected={activeCategory}
          onSelect={setSelectedCategory}
        />
      )}
      <View className="flex-1">{body}</View>
      <QuickAddBar catalogItems={topCatalog.data ?? []} neededNames={neededNames} onAdd={add} />
      <AddItemField onSubmit={add} onOpenDetail={openAddDetail} />
    </View>
  );
}
