import { updateDoc } from '@react-native-firebase/firestore';
import { renderHook, waitFor } from '@testing-library/react-native';
import { OneSignal } from 'react-native-onesignal';

import { savePushToken } from '@/features/notifications/api';
import { usePushTokenSync } from '@/features/notifications/hooks/use-push-token-sync';

jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, ...path: string[]) => ({ path: path.join('/') })),
  updateDoc: jest.fn(() => Promise.resolve()),
  arrayUnion: jest.fn((...values: unknown[]) => ({ arrayUnion: values })),
}));

type ChangeHandler = (event: { current: { id?: string } }) => void;
let mockChangeHandler: ChangeHandler | undefined;

jest.mock('react-native-onesignal', () => ({
  LogLevel: { Verbose: 6 },
  OneSignal: {
    initialize: jest.fn(),
    Debug: { setLogLevel: jest.fn() },
    Notifications: { requestPermission: jest.fn(() => Promise.resolve(true)) },
    User: {
      pushSubscription: {
        getIdAsync: jest.fn(),
        addEventListener: jest.fn((_event: string, handler: ChangeHandler) => {
          mockChangeHandler = handler;
        }),
        removeEventListener: jest.fn(),
      },
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockChangeHandler = undefined;
});

const writes = () =>
  jest.mocked(updateDoc).mock.calls.map(([ref, data]) => [(ref as { path: string }).path, data]);

describe('savePushToken', () => {
  it('yalnızca pushTokens alanına arrayUnion ile ekler', async () => {
    await savePushToken({ uid: 'u1', token: 'sub-1' });
    expect(writes()).toEqual([['users/u1', { pushTokens: { arrayUnion: ['sub-1'] } }]]);
  });
});

describe('usePushTokenSync', () => {
  it('açılışta mevcut abonelik kimliğini kaydeder', async () => {
    jest.mocked(OneSignal.User.pushSubscription.getIdAsync).mockResolvedValue('sub-1');
    await renderHook(() => usePushTokenSync('u1'));

    await waitFor(() =>
      expect(writes()).toEqual([['users/u1', { pushTokens: { arrayUnion: ['sub-1'] } }]]),
    );
  });

  it('kimlik henüz yoksa yazmaz, sonradan gelince (izin verildi) kaydeder', async () => {
    jest.mocked(OneSignal.User.pushSubscription.getIdAsync).mockResolvedValue(null);
    await renderHook(() => usePushTokenSync('u1'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(updateDoc).not.toHaveBeenCalled();

    mockChangeHandler?.({ current: { id: 'sub-2' } });
    await waitFor(() =>
      expect(writes()).toEqual([['users/u1', { pushTokens: { arrayUnion: ['sub-2'] } }]]),
    );
  });

  it('çıkışta (unmount) dinleyiciyi kaldırır', async () => {
    jest.mocked(OneSignal.User.pushSubscription.getIdAsync).mockResolvedValue(null);
    const { unmount } = await renderHook(() => usePushTokenSync('u1'));
    await unmount();
    expect(OneSignal.User.pushSubscription.removeEventListener).toHaveBeenCalledWith(
      'change',
      mockChangeHandler,
    );
  });
});
