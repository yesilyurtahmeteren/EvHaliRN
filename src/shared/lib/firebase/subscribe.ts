// onSnapshot'ı liveQueryOptions'ın beklediği Subscribe biçimine çevirir.
// Doküman verisi burada şemadan geçer; şemaya uymayan veri (Flutter'daki
// fromMap cast hatası) sessizce kabul edilmez, sorgu hata durumuna düşer.
import { onSnapshot, type DocumentReference } from '@react-native-firebase/firestore';

import type { Subscribe } from './live-query';

type DocData = Record<string, unknown>;

// Doküman yoksa null (Flutter: doc.exists ? Model.fromMap(...) : null).
export function subscribeDoc<T>(
  ref: DocumentReference,
  parse: (id: string, data: DocData) => T,
): Subscribe<T | null> {
  return (onNext, onError) =>
    onSnapshot(
      ref,
      (snapshot) => {
        try {
          onNext(snapshot.exists() ? parse(snapshot.id, snapshot.data() as DocData) : null);
        } catch (error) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }
      },
      onError,
    );
}
