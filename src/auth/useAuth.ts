import { create } from 'zustand';
import { tokenStore } from './tokenStore';
import { unregisterPushToken } from '@/notification/push';

export type AuthUser = {
  id: number;
  name: string | null;
  handle: string | null;
  onboarded: boolean;
};

type AuthState = {
  hydrated: boolean;
  isAuthed: boolean;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  signIn: (tokens: { accessToken: string; refreshToken: string }, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
  setOnboarded: (handle: string) => void;
};

export const useAuth = create<AuthState>((set) => ({
  hydrated: false,
  isAuthed: false,
  user: null,
  hydrate: async () => {
    const access = await tokenStore.getAccess();
    set({ hydrated: true, isAuthed: !!access });
  },
  signIn: async (tokens, user) => {
    await tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ isAuthed: true, user });
  },
  signOut: async () => {
    // 푸시 토큰 해제 — 백엔드 DELETE + 디바이스 unregister (무음 fail OK)
    await unregisterPushToken();
    await tokenStore.clear();
    set({ isAuthed: false, user: null });
  },
  setUser: (u) => set({ user: u }),
  setOnboarded: (handle) =>
    set((s) => ({ user: s.user ? { ...s.user, handle, onboarded: true } : s.user })),
}));
