import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';

export type Crop = { id: number; name: string; colorHex: string; stage: string | null };

const KEY = ['crops'];

export function useCrops() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Crop[]>>('/api/v1/crops');
      return unwrap(Promise.resolve(res));
    },
    staleTime: 60_000,
  });
}

export function useCreateCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; colorHex?: string; stage?: string }) => {
      const res = await api.post<ApiResponse<Crop>>('/api/v1/crops', body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: { name?: string; colorHex?: string; stage?: string } }) => {
      const res = await api.patch<ApiResponse<Crop>>(`/api/v1/crops/${id}`, body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCrop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/crops/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
