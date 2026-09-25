// Oturum durumu (Flutter AuthGate'in authStateChanges() akışı).
// Tek yazan useAuthListener; ekranlar yalnızca okur.
//
// Token saklanmıyor: RNFB oturumu ve ID token yenilemeyi kendi (Android
// Keystore destekli) deposunda tutuyor. expo-secure-store'a kopyalamak ikinci,
// senkron tutulması gereken bir kaynak olurdu (docs/ANALYSIS.md §3.1, §5).
import { create } from 'zustand';

export type SessionStatus = 'initializing' | 'signedOut' | 'signedIn';

export type SessionUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

type SessionState = {
  status: SessionStatus;
  user: SessionUser | null;
  // Çıkıştan sonra da son kullanıcı (yalnızca bellekte). useRequiredUser'ın
  // çıkış anındaki son render'da çökmemesi için; yeni girişte değişir.
  lastUser: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  status: 'initializing',
  user: null,
  lastUser: null,
  setUser: (user) =>
    set((state) => ({
      user,
      lastUser: user ?? state.lastUser,
      status: user === null ? 'signedOut' : 'signedIn',
    })),
}));

// Oturum açıkken render edilen (app) ekranları için. Çıkış anında store
// null olur ama korumalı rota ekranı hemen kaldırmayabilir; o son render'da
// çökmemek için son bilinen kullanıcı döner.
export function useRequiredUser(): SessionUser {
  const user = useSessionStore((s) => s.user ?? s.lastUser);
  if (user === null) {
    throw new Error('useRequiredUser called without a signed-in user');
  }
  return user;
}
