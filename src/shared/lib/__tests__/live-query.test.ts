import { QueryClient, QueryObserver } from '@tanstack/react-query';

import { liveQueryOptions, type Subscribe } from '@/shared/lib/firebase/live-query';

// Elle sürülen sahte "onSnapshot" kaynağı.
function fakeSource<T>() {
  let next: ((value: T) => void) | undefined;
  let fail: ((error: Error) => void) | undefined;
  const state = { subscriptions: 0, active: 0 };
  const subscribe: Subscribe<T> = (onNext, onError) => {
    state.subscriptions += 1;
    state.active += 1;
    next = onNext;
    fail = onError;
    return () => {
      state.active -= 1;
    };
  };
  return {
    subscribe,
    state,
    emit: (value: T) => next?.(value),
    fail: (error: Error) => fail?.(error),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function observe<T>(
  client: QueryClient,
  options: ReturnType<typeof liveQueryOptions<T, string[]>>,
) {
  const observer = new QueryObserver(client, options);
  const results: { status: string; data: unknown; error: unknown }[] = [];
  const unsubscribe = observer.subscribe((r) =>
    results.push({ status: r.status, data: r.data, error: r.error }),
  );
  return { observer, results, unsubscribe };
}

describe('liveQueryOptions', () => {
  let client: QueryClient;

  beforeEach(() => {
    client = new QueryClient();
  });

  afterEach(() => {
    client.clear();
  });

  it("ilk snapshot gelene kadar pending, sonraki snapshotlar cache'i günceller", async () => {
    const source = fakeSource<number>();
    const { observer } = observe(client, liveQueryOptions(['n'], source.subscribe));

    await flush();
    expect(observer.getCurrentResult().status).toBe('pending');

    source.emit(1);
    await flush();
    expect(observer.getCurrentResult().data).toBe(1);

    source.emit(2);
    await flush();
    expect(observer.getCurrentResult().data).toBe(2);
    expect(source.state.subscriptions).toBe(1);
  });

  it('ilk okuma hatası "veri yok" değil error durumu olur', async () => {
    const source = fakeSource<string | null>();
    const { observer } = observe(client, liveQueryOptions(['user'], source.subscribe));
    await flush();

    source.fail(new Error('permission-denied'));
    await flush();

    const result = observer.getCurrentResult();
    expect(result.status).toBe('error');
    expect(result.data).toBeUndefined();
    expect(source.state.active).toBe(0);
  });

  it('veri geldikten sonra kopan dinleyici yeniden abone olur', async () => {
    const source = fakeSource<number>();
    const { observer } = observe(client, liveQueryOptions(['n'], source.subscribe));
    await flush();
    source.emit(1);
    await flush();

    source.fail(new Error('unavailable'));
    await flush();
    expect(source.state.subscriptions).toBe(2);
    expect(source.state.active).toBe(1);

    source.emit(5);
    await flush();
    expect(observer.getCurrentResult().data).toBe(5);
  });

  it("sorgu cache'ten atılınca (ör. çıkışta clear) dinleyici kapanır", async () => {
    const source = fakeSource<number>();
    const { unsubscribe } = observe(client, liveQueryOptions(['n'], source.subscribe));
    await flush();
    source.emit(1);
    await flush();
    expect(source.state.active).toBe(1);

    unsubscribe();
    client.clear();
    expect(source.state.active).toBe(0);
  });

  it('enabled: false iken abone olmaz', async () => {
    const source = fakeSource<number>();
    observe(client, liveQueryOptions(['n'], source.subscribe, { enabled: false }));
    await flush();
    expect(source.state.subscriptions).toBe(0);
  });
});
