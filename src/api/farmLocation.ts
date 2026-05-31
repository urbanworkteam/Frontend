import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';

export type FarmLocation = {
  id: number;
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
  kmaGridX: number | null;
  kmaGridY: number | null;
  sortOrder: number;
};

const KEY = ['farm-locations'];

export function useFarmLocations() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<FarmLocation[]>>('/api/v1/farm-locations');
      return unwrap(Promise.resolve(res));
    },
    staleTime: 60_000,
  });
}

export type CreateFarmLocationBody = {
  label: string;
  address: string;
  lat: number;
  lng: number;
};

export type UpdateFarmLocationBody = {
  label?: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export function useCreateFarmLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateFarmLocationBody) => {
      const res = await api.post<ApiResponse<FarmLocation>>('/api/v1/farm-locations', body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateFarmLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateFarmLocationBody }) => {
      const res = await api.patch<ApiResponse<FarmLocation>>(`/api/v1/farm-locations/${id}`, body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFarmLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/farm-locations/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
