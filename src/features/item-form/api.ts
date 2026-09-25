// Flutter FirestoreService.updateItemDetails / setCatalogCategory.
// Ekleme için shopping-list/api.ts addItem kullanılır (aynı transaction).
import { doc, getFirestore, setDoc, updateDoc } from '@react-native-firebase/firestore';

import { normalizeName } from '@/shared/lib/normalize-name';
import type { ItemCategory, ItemUnit } from '@/shared/schemas';

// Kuralın "içerik düzenleme" dalı: yalnızca ad/miktar/not/birim/acil.
// Kim ekledi ve ne zaman değişmez; durum değişimiyle karıştırılmaz.
export function updateItemDetails({
  homeId,
  itemId,
  name,
  quantity,
  note,
  unit,
  urgent,
}: {
  homeId: string;
  itemId: string;
  name: string;
  quantity: number;
  note: string | null;
  unit: ItemUnit;
  urgent: boolean;
}): Promise<void> {
  return updateDoc(doc(getFirestore(), 'homes', homeId, 'items', itemId), {
    name,
    quantity,
    note,
    unit,
    urgent,
  });
}

// Kategori ürünün değil katalog kaydının (normalize ad) alanıdır. null
// "kategori yok" olarak yazılır (alan silinmez). merge: sayaç korunur.
export function setCatalogCategory({
  homeId,
  itemName,
  category,
}: {
  homeId: string;
  itemName: string;
  category: ItemCategory | null;
}): Promise<void> {
  return setDoc(
    doc(getFirestore(), 'homes', homeId, 'catalog', normalizeName(itemName)),
    { category },
    { merge: true },
  );
}
