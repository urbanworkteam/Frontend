import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenStore } from '@/auth/tokenStore';
import { ApiResponse, FarmilyApiError } from './types';

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = await tokenStore.getRefresh();
    if (!refresh) return false;
    try {
      const res = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        `${env.apiBase}/api/v1/auth/refresh`,
        { refreshToken: refresh },
        { timeout: 10_000 },
      );
      const tokens = res.data?.data;
      if (!tokens?.accessToken || !tokens?.refreshToken) return false;
      await tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      await tokenStore.clear();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export const api = axios.create({
  baseURL: env.apiBase,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  const access = await tokenStore.getAccess();
  if (access && cfg.headers) {
    cfg.headers.set('Authorization', `Bearer ${access}`);
  }
  return cfg;
});

type Retried = AxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<ApiResponse<unknown>>) => {
    const cfg = err.config as Retried | undefined;
    if (err.response?.status === 401 && cfg && !cfg._retried) {
      cfg._retried = true;
      const ok = await tryRefresh();
      if (ok) return api.request(cfg);
    }
    const body = err.response?.data;
    const e = body?.error;
    throw new FarmilyApiError(
      e?.code ?? 'NETWORK_ERROR',
      e?.message ?? err.message ?? '네트워크 오류',
      err.response?.status ?? 0,
      e?.field ?? null,
    );
  },
);

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  if (!data.success || data.data === undefined) {
    const e = data.error;
    throw new FarmilyApiError(e?.code ?? 'UNKNOWN', e?.message ?? 'Unknown error', 200, e?.field ?? null);
  }
  return data.data;
}
