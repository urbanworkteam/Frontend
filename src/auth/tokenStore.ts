import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'farmily.accessToken';
const REFRESH_KEY = 'farmily.refreshToken';
const USER_KEY = 'farmily.user';

// expo-secure-store has no web binding; fall back to localStorage so the app
// boots in browser dev. Localstorage is not "secure" — only use on dev.
const isWeb = Platform.OS === 'web';

async function read(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function write(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function remove(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  async getAccess(): Promise<string | null> {
    return read(ACCESS_KEY);
  },
  async getRefresh(): Promise<string | null> {
    return read(REFRESH_KEY);
  },
  async setTokens(access: string, refresh: string): Promise<void> {
    await write(ACCESS_KEY, access);
    await write(REFRESH_KEY, refresh);
  },
  async getUser(): Promise<{ id: number; name: string | null; handle: string | null; onboarded: boolean } | null> {
    const raw = await read(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  async setUser(user: { id: number; name: string | null; handle: string | null; onboarded: boolean }): Promise<void> {
    await write(USER_KEY, JSON.stringify(user));
  },
  async clear(): Promise<void> {
    await remove(ACCESS_KEY);
    await remove(REFRESH_KEY);
    await remove(USER_KEY);
  },
};
