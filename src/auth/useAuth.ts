import { create } from 'zustand';
import { tokenStore } from './tokenStore';
import { unregisterPushToken } from '@/notification/push';
import { api, unwrap } from '@/api/client';
import { ApiResponse } from '@/api/types';
import { MyProfile } from '@/api/profile';

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
    if (!access) {
      set({ hydrated: true, isAuthed: false, user: null });
      return;
    }
    try {
      const res = await api.get<ApiResponse<MyProfile>>('/api/v1/me/profile');
      const profile = await unwrap(Promise.resolve(res));
      set({
        hydrated: true,
        isAuthed: true,
        user: { id: profile.id, name: profile.farm.farmName, handle: profile.handle, onboarded: profile.onboarded },
      });
    } catch {
      set({ hydrated: true, isAuthed: false, user: null });
    }
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
