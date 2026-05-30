import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse, PageResponse } from './types';

export type Platform = 'INSTAGRAM' | 'SMARTSTORE';
export type JobStatus = 'QUEUED' | 'ANALYZING' | 'ENRICHING' | 'GENERATING' | 'DONE' | 'FAILED' | 'REFUNDED';

export type CreateContentBody = {
  platform: Platform;
  cropId: number;
  diaryIds?: number[];
  keywords?: string;
  extraPhotoKeys?: string[];
};

export type JobCreated = { jobId: number; status: JobStatus; creditsRemaining: number };

export type JobStatusResponse = {
  id: number;
  status: JobStatus;
  progressPct: number;
  steps: { key: string; label: string; done: boolean }[];
  failureReason: string | null;
};

export type StoreMeta = {
  brix: string | null;
  harvestPolicy: string | null;
  farmingYears: string | null;
  reasonsToBuy: string[] | null;
  productInfo: Record<string, string> | null;
  price: number | null;
};

export type ContentResult = {
  platform: Platform;
  cardImageUrls: string[];
  caption: string | null;
  hashtags: string[];
  storeMeta: StoreMeta | null;
};

export type HistoryItem = {
  id: number;
  platform: Platform;
  createdAt: string;
  thumbnailUrl: string | null;
  caption: string | null;
};

export function useCreateContent() {
  return useMutation({
    mutationFn: async ({ body, idempotencyKey }: { body: CreateContentBody; idempotencyKey: string }) => {
      const res = await api.post<ApiResponse<JobCreated>>('/api/v1/ai/contents', body, {
        headers: { 'X-Idempotency-Key': idempotencyKey },
      });
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useJobStatus(jobId: number | null, opts?: { pollMs?: number }) {
  return useQuery({
    queryKey: ['ai-job', jobId],
    enabled: jobId !== null,
    queryFn: async () => {
      const res = await api.get<ApiResponse<JobStatusResponse>>(`/api/v1/ai/contents/${jobId}`);
      return unwrap(Promise.resolve(res));
    },
    refetchInterval: (q) => {
      const data = q.state.data as JobStatusResponse | undefined;
      if (!data) return opts?.pollMs ?? 2000;
      return data.status === 'DONE' || data.status === 'FAILED' || data.status === 'REFUNDED'
        ? false
        : opts?.pollMs ?? 2000;
    },
  });
}

export function useJobResult(jobId: number | null) {
  return useQuery({
    queryKey: ['ai-result', jobId],
    enabled: jobId !== null,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ContentResult>>(`/api/v1/ai/contents/${jobId}/result`);
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useUpdateResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, body }: { jobId: number; body: { caption?: string; hashtags?: string[] } }) => {
      await api.patch(`/api/v1/ai/contents/${jobId}/result`, body);
    },
    onSuccess: (_, { jobId }) => qc.invalidateQueries({ queryKey: ['ai-result', jobId] }),
  });
}

export function useRegenerate() {
  return useMutation({
    mutationFn: async ({
      jobId,
      body,
    }: {
      jobId: number;
      body: { keywords?: string; extraPhotoKeys?: string[] };
    }) => {
      const res = await api.post<ApiResponse<{ jobId: number; status: JobStatus; creditsCharged: boolean }>>(
        `/api/v1/ai/contents/${jobId}/regenerate`,
        body,
      );
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useContentHistory(platform: Platform | null) {
  return useQuery({
    queryKey: ['ai-history', platform],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PageResponse<HistoryItem>>>('/api/v1/ai/contents', {
        params: { platform: platform ?? undefined, limit: 20 },
      });
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useCredits() {
  return useQuery({
    queryKey: ['credits'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{
        plan: string;
        creditsRemaining: number;
        creditsLimit: number;
        creditsUsed: number;
        resetAt: string;
      }>>('/api/v1/credits');
      return unwrap(Promise.resolve(res));
    },
  });
}
