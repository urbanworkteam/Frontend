import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';

export type Subscription = {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  creditsRemaining: number;
  creditsUsed: number;
  creditsLimit: number;
};

export type Plan = {
  code: string;
  name: string;
  price: number;
  period: string;
  creditsLimit: number | null;
  features: string[];
  disabled: boolean;
  recommended: boolean;
  comingSoon: boolean;
};

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Subscription>>('/api/v1/subscription');
      return unwrap(Promise.resolve(res));
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    staleTime: 60 * 60_000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Plan[]>>('/api/v1/subscription/plans');
      return unwrap(Promise.resolve(res));
    },
  });
}

export type CheckoutStart = {
  checkoutId: number;
  merchantUid: string;
  pgProvider: string;
  amount: number;
  buyer: { name: string | null; email: string | null };
};

export function useStartCheckout() {
  return useMutation({
    mutationFn: async (plan: string) => {
      const res = await api.post<ApiResponse<CheckoutStart>>('/api/v1/subscription/checkout', { plan });
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useConfirmCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ checkoutId, impUid, merchantUid }: { checkoutId: number; impUid: string; merchantUid: string }) => {
      const res = await api.post<ApiResponse<Subscription>>(`/api/v1/subscription/checkout/${checkoutId}/confirm`, {
        impUid,
        merchantUid,
      });
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ status: string; validUntil: string }>>('/api/v1/subscription/cancel');
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  });
}
