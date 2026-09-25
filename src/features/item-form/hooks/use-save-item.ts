// Ekleme: sayfa hemen kapanır, ürün kimliği önceden üretildiği için liste
// yazma bitmeden yeni satırı vurgular ve toast gösterilir ("süt bitti" 3
// saniyede). Yazma arka planda sürer; başarısız olursa hata toast'u gelir.
// Düzenleme: içerik + katalog bölümü yazılır, bitince sayfa kapanır.
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { useRequiredUser } from '@/features/auth/store';
import { useShellUi } from '@/features/shell/ui-store';
import { addItem, deleteItem, newItemId } from '@/features/shopping-list/api';
import { showToast } from '@/shared/components/toast/toast-store';
import { reportError, useFeedbackMutation } from '@/shared/lib/feedback';
import type { Item } from '@/shared/schemas';

import { setCatalogCategory, updateItemDetails } from '../api';
import type { ItemFormValues } from '../schemas';

export function useAddFromForm(homeId: string) {
  const { t } = useTranslation();
  const { uid } = useRequiredUser();
  return (values: ItemFormValues) => {
    const itemId = newItemId(homeId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem({ homeId, uid, itemId, ...values }).catch((error: unknown) => reportError(error));
    const ui = useShellUi.getState();
    ui.setFlash(itemId);
    ui.bump();
    showToast(t('list.added', { name: values.name }));
  };
}

export function useEditItem(homeId: string, item: Item | undefined) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: async (values: ItemFormValues) => {
      if (item === undefined) {
        return;
      }
      await updateItemDetails({
        homeId,
        itemId: item.id,
        name: values.name,
        quantity: values.quantity,
        // Not alanı yeni tasarımda yok; eski not korunur.
        note: item.note,
        unit: values.unit,
        urgent: values.urgent,
      });
      await setCatalogCategory({ homeId, itemName: values.name, category: values.category });
    },
    onSuccess: (_data, values) => showToast(t('list.saved', { name: values.name })),
  });
}

export function useDeleteItem(homeId: string) {
  const { t } = useTranslation();
  return useFeedbackMutation({
    mutationFn: (item: Item) => deleteItem({ homeId, itemId: item.id }),
    onSuccess: (_data, item) => showToast(t('itemForm.deleted', { name: item.name })),
  });
}
