// Flutter FirestoreService'in liste işlemleri: addItem (transaction),
// markBought / markNeeded, 7 günlük temizlik, sık alınanlar, kategoriler.
// Alan adları ve biçimler firestore.rules ile birebir aynı olmalı.
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from '@react-native-firebase/firestore';

import { normalizeName } from '@/shared/lib/normalize-name';
import {
  catalogItemSchema,
  itemCategorySchema,
  type CatalogItem,
  type ItemCategory,
  type ItemUnit,
} from '@/shared/schemas';

const boughtRetentionMs = 7 * 24 * 60 * 60 * 1000;
export const topCatalogLimit = 12;

export type AddItemInput = {
  homeId: string;
  name: string;
  uid: string;
  quantity?: number;
  note?: string | null;
  // undefined: katalogdaki mevcut kategori korunur (hızlı ekleme yolu).
  // Ürün formundan bir değer (null dahil) seçilirse o yazılır.
  category?: ItemCategory | null;
  unit?: ItemUnit;
  urgent?: boolean;
};

// Ürün + katalog sayacı tek transaction'da. catalog tam doküman olarak
// yazıldığı için mevcut kategori okunup geri yazılır, yoksa bir sonraki
// eklemede silinirdi (Flutter'da Faz 7'de bulunan hata).
export async function addItem({
  homeId,
  name,
  uid,
  quantity = 1,
  note = null,
  category,
  unit = 'adet',
  urgent = false,
}: AddItemInput): Promise<void> {
  const db = getFirestore();
  const itemRef = doc(collection(db, 'homes', homeId, 'items'));
  const catalogRef = doc(db, 'homes', homeId, 'catalog', normalizeName(name));

  await runTransaction(db, async (transaction) => {
    const catalogSnap = await transaction.get(catalogRef);
    const existing = catalogSnap.exists() ? catalogSnap.data() : undefined;
    const currentCount = typeof existing?.count === 'number' ? existing.count : 0;
    const existingCategory = itemCategorySchema
      .nullable()
      .catch(null)
      .parse(existing?.category ?? null);

    transaction.set(itemRef, {
      name,
      status: 'needed',
      addedBy: uid,
      addedAt: serverTimestamp(),
      boughtBy: null,
      boughtAt: null,
      // Cloudflare Worker bildirimi gönderince true yapar (Faz 5).
      notified: false,
      quantity,
      note,
      unit,
      urgent,
    });
    transaction.set(catalogRef, {
      name,
      count: currentCount + 1,
      lastUsedAt: serverTimestamp(),
      category: category === undefined ? existingCategory : category,
    });
  });
}

export function markBought({
  homeId,
  itemId,
  uid,
}: {
  homeId: string;
  itemId: string;
  uid: string;
}): Promise<void> {
  return updateDoc(doc(getFirestore(), 'homes', homeId, 'items', itemId), {
    status: 'bought',
    boughtBy: uid,
    boughtAt: serverTimestamp(),
  });
}

export function markNeeded({ homeId, itemId }: { homeId: string; itemId: string }): Promise<void> {
  return updateDoc(doc(getFirestore(), 'homes', homeId, 'items', itemId), {
    status: 'needed',
    boughtBy: null,
    boughtAt: null,
  });
}

// Liste açılışında 7 günden eski alınan kayıtlar silinir (Flutter CLAUDE.md §3).
export async function cleanupOldBoughtItems(homeId: string, now = Date.now()): Promise<number> {
  const db = getFirestore();
  const snapshot = await getDocs(
    query(
      collection(db, 'homes', homeId, 'items'),
      where('status', '==', 'bought'),
      where('boughtAt', '<', Timestamp.fromDate(new Date(now - boughtRetentionMs))),
    ),
  );
  if (snapshot.empty) {
    return 0;
  }
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snapshot.size;
}

// En sık eklenen 12 ürün (çip satırı). Canlı değil, tek okuma: sıra oturum
// içinde dondurulur (bkz. useFrozenTopCatalog).
export async function fetchTopCatalog(homeId: string): Promise<CatalogItem[]> {
  const snapshot = await getDocs(
    query(
      collection(getFirestore(), 'homes', homeId, 'catalog'),
      orderBy('count', 'desc'),
      limit(topCatalogLimit),
    ),
  );
  return snapshot.docs.map((d) => catalogItemSchema.parse({ ...d.data(), id: d.id }));
}
