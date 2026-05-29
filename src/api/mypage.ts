import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';

export type MyPageData = {
  account: { name: string | null; phone: string | null; email: string | null };
  crops: { count: number; preview: string[] };
  farmLocations: { count: number };
  subscription: { plan: string; creditsUsed: number; creditsLimit: number; resetAt: string };
};

export function useMyPage() {
  return useQuery({
    queryKey: ['mypage'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MyPageData>>('/api/v1/mypage');
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name?: string; email?: string }) => {
      const res = await api.patch<ApiResponse<{ name: string; phone: string | null; email: string }>>(
        '/api/v1/mypage/account',
        body,
      );
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mypage'] }),
  });
}
