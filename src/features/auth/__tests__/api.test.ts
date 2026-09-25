import { signInWithCredential, signOut as firebaseSignOut } from '@react-native-firebase/auth';
import { getDoc, setDoc, updateDoc } from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { signInWithGoogle, signOut } from '@/features/auth/api';

// Native modüller testte yok; yalnızca akışın Flutter AuthService ile aynı
// Firestore yazmalarını yaptığı doğrulanıyor.
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: { credential: jest.fn((idToken, accessToken) => ({ idToken, accessToken })) },
  signInWithCredential: jest.fn(),
  signOut: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn((_db, ...path: string[]) => ({ path: path.join('/') })),
  getDoc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
    getTokens: jest.fn(() => Promise.resolve({ idToken: 'id', accessToken: 'access' })),
    signOut: jest.fn(() => Promise.resolve()),
  },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
  isErrorWithCode: (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error,
  isSuccessResponse: (response: { type: string }) => response.type === 'success',
}));

const user = { uid: 'u1', displayName: 'Ayşe', photoURL: 'https://example.com/a.png' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(GoogleSignin.signIn).mockResolvedValue({
    type: 'success',
    data: { idToken: null } as never,
  });
  jest.mocked(signInWithCredential).mockResolvedValue({ user } as never);
});

describe('signInWithGoogle', () => {
  it('ilk girişte users/{uid} dokümanını homeId: null ile oluşturur', async () => {
    jest.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);

    await expect(signInWithGoogle()).resolves.toBe('success');
    expect(setDoc).toHaveBeenCalledWith(
      { path: 'users/u1' },
      { displayName: 'Ayşe', photoUrl: 'https://example.com/a.png', homeId: null },
    );
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('sonraki girişlerde yalnızca ad ve fotoğrafı günceller, homeId korunur', async () => {
    jest.mocked(getDoc).mockResolvedValue({ exists: () => true } as never);

    await signInWithGoogle();
    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'users/u1' },
      { displayName: 'Ayşe', photoUrl: 'https://example.com/a.png' },
    );
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('idToken yoksa (web client ID tanımsız) accessToken ile giriş yapar', async () => {
    jest.mocked(getDoc).mockResolvedValue({ exists: () => true } as never);

    await signInWithGoogle();
    expect(signInWithCredential).toHaveBeenCalledWith({}, { idToken: null, accessToken: 'access' });
  });

  it("hesap seçici kapatılırsa cancelled döner, Firebase'e gidilmez", async () => {
    jest.mocked(GoogleSignin.signIn).mockResolvedValue({ type: 'cancelled', data: null });
    await expect(signInWithGoogle()).resolves.toBe('cancelled');

    jest.mocked(GoogleSignin.signIn).mockRejectedValue({ code: statusCodes.SIGN_IN_CANCELLED });
    await expect(signInWithGoogle()).resolves.toBe('cancelled');
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it('diğer Google hataları yukarı iletilir (ekranda hata mesajı)', async () => {
    jest.mocked(GoogleSignin.signIn).mockRejectedValue({ code: 'DEVELOPER_ERROR' });
    await expect(signInWithGoogle()).rejects.toEqual({ code: 'DEVELOPER_ERROR' });
  });
});

describe('signOut', () => {
  it('önce Google, sonra Firebase oturumunu kapatır', async () => {
    await signOut();
    expect(GoogleSignin.signOut).toHaveBeenCalled();
    expect(firebaseSignOut).toHaveBeenCalled();
  });
});
