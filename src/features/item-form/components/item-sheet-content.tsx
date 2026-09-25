import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useCatalogCategories } from '@/features/shopping-list/hooks/use-list-data';
import { AppText } from '@/shared/components/app-text';
import { Button } from '@/shared/components/button';
import { Spinner } from '@/shared/components/spinner';
import { useRequiredHomeId } from '@/shared/hooks/home-id';
import { useBoughtItems, useNeededItems } from '@/shared/hooks/use-items';
import { normalizeName } from '@/shared/lib/normalize-name';

import { useAddFromForm, useDeleteItem, useEditItem } from '../hooks/use-save-item';
import { emptyItemForm } from '../schemas';
import { ItemForm } from './item-form';

// itemId null: yeni ihtiyaç; değilse listedeki ürünü düzenleme. Ürün canlı
// liste sorgularının cache'inden bulunur.
export function ItemSheetContent({
  itemId,
  onClose,
}: {
  itemId: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const homeId = useRequiredHomeId();
  const needed = useNeededItems(homeId);
  const bought = useBoughtItems(homeId);
  const categories = useCatalogCategories(homeId);
  const add = useAddFromForm(homeId);
  const item =
    itemId === null
      ? undefined
      : [...(needed.data?.items ?? []), ...(bought.data?.items ?? [])].find((i) => i.id === itemId);
  const edit = useEditItem(homeId, item);
  const remove = useDeleteItem(homeId);

  if (itemId === null) {
    return (
      <ItemForm
        mode="add"
        initialValues={emptyItemForm}
        onSubmit={(values) => {
          add(values);
          onClose();
        }}
        onClose={onClose}
      />
    );
  }

  if (categories.isPending || needed.isPending) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <Spinner />
      </View>
    );
  }

  if (item === undefined) {
    // Başka bir üye silmiş ya da 7 günlük temizlikte gitmiş olabilir.
    return (
      <View style={{ gap: 16, paddingTop: 8 }}>
        <AppText size={18} weight="bold">
          {t('itemForm.itemNotFound')}
        </AppText>
        <Button label={t('common.close')} variant="well" onPress={onClose} />
      </View>
    );
  }

  return (
    <ItemForm
      mode="edit"
      initialValues={{
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        urgent: item.urgent,
        category: categories.data?.get(normalizeName(item.name)) ?? 'other',
      }}
      saving={edit.isPending || remove.isPending}
      onSubmit={(values) => {
        void edit.run(values).then((ok) => {
          if (ok) {
            onClose();
          }
        });
      }}
      onDelete={() => {
        void remove.run(item).then((ok) => {
          if (ok) {
            onClose();
          }
        });
      }}
      onClose={onClose}
    />
  );
}
