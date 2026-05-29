import { useMutation } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';
import { tokenStore } from '@/auth/tokenStore';
import { useAuth } from '@/auth/useAuth';

export type KakaoLoginRequest = { code: string; redirectUri?: string };
export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNewUser: boolean;
  user: { id: number; name: string | null; handle: string | null; onboarded: boolean };
};

export type OnboardingRequest = {
  handle: string;
  farmDisplayName: string;
  region?: string;
  farmingMethod?: string;
  crops: { name: string; colorHex?: string; stage?: string }[];
  farmLocation: { label: string; address: string };
};

export type OnboardingResponse = {
  user: { id: number; name: string | null; handle: string | null };
  farmProfile: { farmName: string; region: string | null; farmingMethod: string | null };
  crops: { id: number; name: string; colorHex: string; stage: string | null }[];
  farmLocation: {
    id: number;
    label: string;
    address: string;
    lat: number | null;
    lng: number | null;
    kmaGridX: number | null;
    kmaGridY: number | null;
  };
};

export type HandleCheckResponse = { available: boolean; suggestions: string[] };

export function useKakaoLogin() {
  const signIn = useAuth((s) => s.signIn);
  return useMutation({
    mutationFn: async (req: KakaoLoginRequest) => {
      const res = await api.post<ApiResponse<AuthTokenResponse>>('/api/v1/auth/kakao', req);
      const data = await unwrap(Promise.resolve(res));
      await signIn(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );
      return data;
    },
  });
}

export function useLogout() {
  const signOut = useAuth((s) => s.signOut);
  return useMutation({
    mutationFn: async () => {
      const refreshToken = await tokenStore.getRefresh();
      if (refreshToken) {
        try {
          await api.post('/api/v1/auth/logout', { refreshToken });
        } catch {
          /* ignore — proceed with local sign-out */
        }
      }
      await signOut();
    },
  });
}

export function useWithdraw() {
  const signOut = useAuth((s) => s.signOut);
  return useMutation({
    mutationFn: async (reason?: string) => {
      const res = await api.post<ApiResponse<{ purgeAt: string }>>('/api/v1/auth/withdraw', { reason });
      const data = await unwrap(Promise.resolve(res));
      await signOut();
      return data;
    },
  });
}

export async function checkHandle(handle: string): Promise<HandleCheckResponse> {
  const res = await api.get<ApiResponse<HandleCheckResponse>>('/api/v1/onboarding/handle/check', {
    params: { handle },
  });
  return unwrap(Promise.resolve(res));
}

export function useOnboard() {
  const setOnboarded = useAuth((s) => s.setOnboarded);
  return useMutation({
    mutationFn: async (req: OnboardingRequest) => {
      const res = await api.post<ApiResponse<OnboardingResponse>>('/api/v1/onboarding', req);
      const data = await unwrap(Promise.resolve(res));
      setOnboarded(data.user.handle ?? '');
      return data;
    },
  });
}
