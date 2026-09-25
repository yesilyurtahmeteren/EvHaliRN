import { useRequiredUser } from '@/features/auth/store';
import { addItem } from '@/features/shopping-list/api';
import { useFeedbackMutation } from '@/shared/lib/feedback';

import { setCatalogCategory, updateItemDetails } from '../api';
import type { ItemFormValues } from '../schemas';

// Flutter _handleSave: düzenlemede içerik + katalog kategorisi, eklemede
// addItem transaction'ı. Başarıda form kapanır (çağıran), hatada toast.
export function useSaveItem(homeId: string, editingItemId: string | null) {
  const { uid } = useRequiredUser();
  return useFeedbackMutation({
    mutationFn: async (values: ItemFormValues) => {
      if (editingItemId !== null) {
        await updateItemDetails({
          homeId,
          itemId: editingItemId,
          name: values.name,
          quantity: values.quantity,
          note: values.note,
          unit: values.unit,
          urgent: values.urgent,
        });
        await setCatalogCategory({ homeId, itemName: values.name, category: values.category });
        return;
      }
      await addItem({
        homeId,
        uid,
        name: values.name,
        quantity: values.quantity,
        note: values.note,
        unit: values.unit,
        urgent: values.urgent,
        // Flutter: `category ?? existingCategory` - "Kategori yok" seçiliyken
        // katalogdaki mevcut kategori korunur (undefined = koru).
        category: values.category ?? undefined,
      });
    },
  });
}
