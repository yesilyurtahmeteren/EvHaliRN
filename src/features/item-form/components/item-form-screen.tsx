import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useRequiredUser } from '@/features/auth/store';
import {
  useCatalogCategories,
  useFrozenTopCatalog,
} from '@/features/shopping-list/hooks/use-list-data';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { LoadingBar } from '@/shared/components/loading-bar';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useHome, useMembers } from '@/shared/hooks/use-home';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import { normalizeName } from '@/shared/lib/normalize-name';

import { useSaveItem } from '../hooks/use-save-item';
import { ItemForm } from './item-form';

// Rota: /item-form?itemId=... (düzenleme) ya da ?initialName=... (ekleme).
// Ürün URL'de taşınmaz; canlı liste sorgularının cache'inden bulunur.
// Listenin üzerinde saydam modal olarak açılır; boşluğa dokunmak kapatır.
export function ItemFormScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ itemId?: string; initialName?: string }>();
  const itemId =
    typeof params.itemId === 'string' && params.itemId.length > 0 ? params.itemId : null;
  const initialName = typeof params.initialName === 'string' ? params.initialName : '';

  const homeId = useRequiredHomeId();
  const { uid } = useRequiredUser();
  const needed = useNeededItems(homeId);
  const bought = useBoughtItems(homeId);
  const home = useHome(homeId);
  const members = useMembers(homeId);
  const categories = useCatalogCategories(homeId);
  const topCatalog = useFrozenTopCatalog(homeId);
  const save = useSaveItem(homeId, itemId);

  const close = () => router.back();

  const item =
    itemId === null
      ? undefined
      : [...(needed.data?.items ?? []), ...(bought.data?.items ?? [])].find((i) => i.id === itemId);
  const itemsLoading = itemId !== null && (needed.isPending || bought.isPending);

  let content;
  if (categories.isPending || itemsLoading) {
    content = (
      <View className="rounded-t-xl bg-surface-container-low p-xl">
        <LoadingBar />
      </View>
    );
  } else if (itemId !== null && item === undefined) {
    // Başka bir üye silmiş ya da 7 günlük temizlikte gitmiş olabilir.
    content = (
      <View className="gap-md rounded-t-xl bg-surface-container-low p-xl">
        <AppText variant="body-lg">{t('itemForm.itemNotFound')}</AppText>
        <Button label={t('common.cancel')} variant="secondary" onPress={close} />
      </View>
    );
  } else {
    const lookupName = item?.name ?? initialName;
    const categoriesByName = categories.data ?? new Map();
    content = (
      <ItemForm
        mode={item === undefined ? 'add' : 'edit'}
        defaultValues={{
          name: lookupName,
          quantity: item?.quantity ?? 1,
          unit: item?.unit ?? 'adet',
          note: item?.note ?? '',
          urgent: item?.urgent ?? false,
          category:
            lookupName.trim().length > 0
              ? (categoriesByName.get(normalizeName(lookupName)) ?? null)
              : null,
        }}
        homeName={home.data?.name ?? null}
        syncTargetNames={(members.data ?? [])
          .filter((member) => member.uid !== uid && member.displayName.length > 0)
          .map((member) => member.displayName)}
        suggestions={topCatalog.data ?? []}
        categoriesByName={categoriesByName}
        saving={save.isPending}
        onSubmit={(values) => {
          void save.run(values).then((ok) => {
            if (ok) {
              close();
            }
          });
        }}
        onClose={close}
      />
    );
  }

  return (
    <View className="flex-1 justify-end">
      {/* Karartma yalnızca dokunmatik kısayol; ekran okuyucu formdaki kapat
          düğmesini ya da geri hareketini kullanır. */}
      <Pressable
        accessible={false}
        importantForAccessibility="no"
        onPress={close}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      />
      {content}
    </View>
  );
}
