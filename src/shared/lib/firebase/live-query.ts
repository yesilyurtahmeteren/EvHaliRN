// Firestore onSnapshot aboneliklerini TanStack Query cache'ine bağlar
// (docs/ANALYSIS.md R5). Flutter'daki StreamBuilder'ın karşılığı:
//
// - İlk snapshot gelene kadar sorgu "pending" (Flutter: ConnectionState.waiting).
// - Sonraki her snapshot setQueryData ile cache'e yazılır, bileşenler yeniden
//   render olur.
// - Okuma hatası (izin, App Check, ağ) sorguyu "error" durumuna düşürür.
//   Bu, "veri yok" ile KARIŞTIRILMAMALI: Flutter HomeGate'teki hata, kullanıcıyı
//   yanlışlıkla Ev Oluştur ekranına atıyordu (Flutter CLAUDE.md, Faz 6 notu).
// - Sorgu cache'ten atılınca (son gözlemci gittikten gcTime sonra ya da
//   çıkışta queryClient.clear()) Firestore dinleyicisi kapatılır.
//
// Firestore'a bağımlı değil: `subscribe` herhangi bir abonelik fonksiyonu
// olabilir, bu yüzden testte sahte kaynakla sınanabiliyor.
import {
  queryOptions,
  type QueryClient,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';

export type Unsubscribe = () => void;
export type Subscribe<T> = (
  onNext: (value: T) => void,
  onError: (error: Error) => void,
) => Unsubscribe;

// Son gözlemci ayrıldıktan sonra dinleyici bu kadar süre açık kalır; sekme
// değişimi gibi kısa ayrılmalarda yeniden abone olmayı önler.
export const liveQueryGcTimeMs = 60_000;

const listenersByClient = new WeakMap<QueryClient, Map<string, Unsubscribe>>();

function listenersFor(client: QueryClient): Map<string, Unsubscribe> {
  let listeners = listenersByClient.get(client);
  if (listeners === undefined) {
    const created = new Map<string, Unsubscribe>();
    client.getQueryCache().subscribe((event) => {
      if (event.type === 'removed') {
        created.get(event.query.queryHash)?.();
        created.delete(event.query.queryHash);
      }
    });
    listenersByClient.set(client, created);
    listeners = created;
  }
  return listeners;
}

export function liveQueryOptions<T, TKey extends QueryKey>(
  queryKey: TKey,
  subscribe: Subscribe<T>,
  options: Pick<UseQueryOptions<T, Error, T, TKey>, 'enabled'> = {},
) {
  return queryOptions<T, Error, T, TKey>({
    queryKey,
    ...options,
    staleTime: Infinity,
    gcTime: liveQueryGcTimeMs,
    retry: false,
    queryFn: ({ client, queryKey: key }) =>
      new Promise<T>((resolve, reject) => {
        const listeners = listenersFor(client);
        const hash = client.getQueryCache().find({ queryKey: key, exact: true })?.queryHash;
        if (hash === undefined) {
          reject(new Error('Live query is not in the cache'));
          return;
        }
        // Yeniden çalıştırmada (resetQueries vb.) eski dinleyici kapanır.
        listeners.get(hash)?.();

        let settled = false;
        let closed = false;
        let unsubscribe: Unsubscribe | undefined;
        const close = () => {
          if (closed) {
            return;
          }
          closed = true;
          unsubscribe?.();
          if (listeners.get(hash) === close) {
            listeners.delete(hash);
          }
        };

        unsubscribe = subscribe(
          (value) => {
            if (closed) {
              return;
            }
            if (!settled) {
              settled = true;
              resolve(value);
            } else {
              client.setQueryData<T>(key, value);
            }
          },
          (error) => {
            if (closed) {
              return;
            }
            close();
            if (!settled) {
              settled = true;
              reject(error);
            } else {
              // Veri geldikten sonra kopan dinleyici: sorgu sıfırlanıp yeniden
              // abone olunur. Hata sürüyorsa bu sefer ilk yanıt olarak reject
              // edilir ve sorgu error durumunda kalır (döngü yok).
              void client.resetQueries({ queryKey: key, exact: true });
            }
          },
        );
        // subscribe senkron olarak hata verip close() çağırdıysa kaydetme.
        if (closed) {
          unsubscribe();
        } else {
          listeners.set(hash, close);
        }
      }),
  });
}
