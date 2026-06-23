import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';

export type BlockType = 'CROP_INTRO' | 'STORY' | 'CALENDAR' | 'DIVIDER' | 'TEXT';
export type SalesChannelCode = 'SMARTSTORE' | 'INSTAGRAM' | 'DAANGN';

export type MyProfile = {
  id: number;
  handle: string | null;
  onboarded: boolean;
  farm: {
    farmName: string | null;
    region: string | null;
    farmingMethod: string | null;
    backgroundImageUrl: string | null;
    avatarImageUrl: string | null;
    story: { text: string | null; imageUrls: string[]; videoUrl: string | null };
  };
  salesChannels: { id: number; channel: SalesChannelCode; url: string }[];
  blocks: { id: number; blockType: BlockType; sortOrder: number; visible: boolean; payload: Record<string, unknown> }[];
};

export type UpdateProfileBody = {
  farm?: { farmName?: string; region?: string; farmingMethod?: string };
  backgroundImageKey?: string;
  avatarImageKey?: string;
  story?: { text?: string; imageKeys?: string[]; videoKey?: string };
  salesChannels?: { channel: SalesChannelCode; url: string }[];
};

const KEY = ['profile', 'me'];

export function useMyProfile() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await api.get<ApiResponse<MyProfile>>('/api/v1/me/profile');
      return unwrap(Promise.resolve(res));
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: UpdateProfileBody) => {
      const res = await api.patch<ApiResponse<MyProfile>>('/api/v1/me/profile', body);
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReorderBlocks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blocks: { id: number; sortOrder: number; visible: boolean; payload?: Record<string, unknown> }[]) => {
      await api.put('/api/v1/me/profile/blocks', { blocks });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddTextBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body: string }) => {
      const res = await api.post<ApiResponse<number>>('/api/v1/me/profile/blocks', {
        blockType: 'TEXT',
        payload,
      });
      return unwrap(Promise.resolve(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/me/profile/blocks/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useProfileCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['profile-calendar', year, month],
    queryFn: async () => {
      const res = await api.get('/api/v1/me/profile/calendar', { params: { year, month } });
      return unwrap(Promise.resolve(res)) as Promise<{
        days: { date: string; tags: { crop: string; color: string; workType: string }[] }[];
      }>;
    },
  });
}
