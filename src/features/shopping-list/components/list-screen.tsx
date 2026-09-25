import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { useRequiredUser } from '@/features/auth/store';
import { useShellUi } from '@/features/shell/ui-store';
import { AppText } from '@/shared/components/app-text';
import { Box } from '@/shared/components/box';
import { Button } from '@/shared/components/button';
import { Rise, ScreenEnter } from '@/shared/components/motion';
import { ErrorView, LoadingScreen } from '@/shared/components/states';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useFocusKey } from '@/shared/hooks/use-focus-key';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import { roleOf, type AppUser } from '@/shared/schemas';
import { sizes } from '@/shared/theme';

import { cleanupOldBoughtItems } from '../api';
import { useCheckOff } from '../hooks/use-check-off';
import { useCatalogCategories } from '../hooks/use-list-data';
import { groupByCategory } from '../lib/group-items';
import { ItemRow } from './item-row';
import { BoughtSection, CategoryHeader, EmptyListCard, OfflineBanner } from './list-sections';
import { ProgressCard } from './progress-card';

const emptyMembers: ReadonlyMap<string, AppUser> = new Map();

// Alışveriş Listesi (HANDOFF §2.2): ilerleme kartı, İhtiyaç Ekle düğmesi,
// bölümlere göre gruplu liste, Alınanlar ve boş durum.
export function ListScreen() {
  const { t } = useTranslation();
  const homeId = useRequiredHomeId();
  const { uid } = useRequiredUser();
  const needed = useNeededItems(homeId);
  const bought = useBoughtItems(homeId);
  const home = useHome(homeId);
  const members = useMembers(homeId);
  const categories = useCatalogCategories(homeId);
  const { checking, restoredAt, toggle, restore } = useCheckOff(homeId);
  const openItemSheet = useShellUi((s) => s.openItemSheet);
  const flash = useShellUi((s) => s.flash);
  const [boughtOpen, setBoughtOpen] = useState(false);
  const focusKey = useFocusKey();

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
  const groups = useMemo(
    () => groupByCategory(needed.data?.items ?? [], categories.data ?? new Map(), restoredAt),
    [needed.data?.items, categories.data, restoredAt],
  );
  const readOnly = home.data != null && roleOf(home.data, uid) === 'guest';

  if (needed.isPending) {
    return <LoadingScreen />;
  }
  if (needed.isError) {
    return <ErrorView message={t('errors.generic')} onRetry={() => void needed.refetch()} />;
  }

  const neededItems = needed.data.items;
  const boughtItems = bought.data?.items ?? [];
  // Satır giriş gecikmesi: 140 ms + sıra * 70 ms (en fazla 8 kademe).
  const rowDelay = new Map<string, number>();
  groups
    .flatMap((group) => group.items)
    .forEach((item, i) => rowDelay.set(item.id, 140 + Math.min(i, 8) * 70));

  return (
    <View style={{ flex: 1 }}>
      {needed.data.fromCache && <OfflineBanner />}
      {focusKey > 0 && (
        <ScreenEnter key={focusKey}>
          <ScrollView
            contentContainerStyle={{
              paddingTop: 16,
              paddingHorizontal: 20,
              paddingBottom: sizes.contentBottom,
            }}
          >
            <ProgressCard pending={neededItems.length} bought={boughtItems.length} />

            <Rise delay={200} style={{ marginTop: 14 }}>
              {readOnly ? (
                <Box bg="well" style={{ padding: 16, borderRadius: 20 }}>
                  <AppText size={16} tone="ink2" scaled>
                    {t('list.guestNote')}
                  </AppText>
                </Box>
              ) : (
                <Button
                  label={t('list.addButton')}
                  icon="plus"
                  iconStrokeWidth={2.6}
                  onPress={() => openItemSheet(null)}
                />
              )}
            </Rise>

            {neededItems.length === 0 && <EmptyListCard />}

            {groups.map((group, groupIndex) => (
              <Animated.View key={group.category} layout={LinearTransition.duration(300)}>
                <CategoryHeader
                  category={group.category}
                  count={group.items.length}
                  delay={100 + groupIndex * 60}
                />
                <View style={{ gap: 10 }}>
                  {group.items.map((item) => {
                    const delay = rowDelay.get(item.id) ?? 140;
                    return (
                      <Animated.View
                        key={item.id}
                        layout={LinearTransition.duration(300)}
                        exiting={FadeOut.duration(200)}
                      >
                        <Rise delay={delay}>
                          <ItemRow
                            item={item}
                            checking={checking.has(item.id)}
                            flashKey={flash?.id === item.id ? flash.key : null}
                            members={memberMap}
                            readOnly={readOnly}
                            onToggle={() => toggle(item)}
                            onEdit={() => openItemSheet(item.id)}
                          />
                        </Rise>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            ))}

            <BoughtSection
              items={boughtItems}
              open={boughtOpen}
              readOnly={readOnly}
              onToggle={() => setBoughtOpen((o) => !o)}
              onRestore={restore}
            />
          </ScrollView>
        </ScreenEnter>
      )}
    </View>
  );
}
