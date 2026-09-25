// onSnapshot'ı liveQueryOptions'ın beklediği Subscribe biçimine çevirir.
// Doküman verisi burada şemadan geçer; şemaya uymayan veri (Flutter'daki
// fromMap cast hatası) sessizce kabul edilmez, sorgu hata durumuna düşer.
import { onSnapshot, type DocumentReference, type Query } from '@react-native-firebase/firestore';

import type { Subscribe } from './live-query';

export type DocData = Record<string, unknown>;

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

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
          onError(toError(error));
        }
      },
      onError,
    );
}

export type QueryResult<T> = {
  items: T[];
  // Veri sunucudan değil yerel önbellekten: şu an canlı bağlantı yok.
  // Flutter neededItemsStream'deki isOffline ile aynı; hasPendingWrites
  // KASITLI kullanılmıyor (çevrimiçiyken her yazımda yanıp sönerdi).
  fromCache: boolean;
};

export function subscribeQuery<T>(
  query: Query,
  parse: (id: string, data: DocData) => T,
): Subscribe<QueryResult<T>> {
  // includeMetadataChanges: önbellekten sunucuya geçiş veri değişmese de
  // bildirilsin, yoksa fromCache ilk değerinde (true) takılı kalır.
  return (onNext, onError) =>
    onSnapshot(
      query,
      { includeMetadataChanges: true },
      (snapshot) => {
        try {
          onNext({
            items: snapshot.docs.map((d) => parse(d.id, d.data() as DocData)),
            fromCache: snapshot.metadata.fromCache,
          });
        } catch (error) {
          onError(toError(error));
        }
      },
      onError,
    );
}
