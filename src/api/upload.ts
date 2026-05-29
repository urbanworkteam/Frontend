import { useMutation } from '@tanstack/react-query';
import { api, unwrap } from './client';
import { ApiResponse } from './types';

export type PresignRequest = {
  kind: 'DIARY' | 'PROFILE_BG' | 'PROFILE_AVATAR' | 'STORY' | 'CONTENT_EXTRA';
  ext: 'jpg' | 'jpeg' | 'png' | 'webp';
  sizeBytes: number;
};

export type PresignResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
};

export function usePresign() {
  return useMutation({
    mutationFn: async (body: PresignRequest) => {
      const res = await api.post<ApiResponse<PresignResponse>>('/api/v1/uploads/presign', body);
      return unwrap(Promise.resolve(res));
    },
  });
}

export async function uploadToS3(uploadUrl: string, blob: Blob, contentType: string): Promise<void> {
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
  if (!res.ok) throw new Error(`S3 PUT 실패: ${res.status}`);
}

export function extOf(uri: string): 'jpg' | 'jpeg' | 'png' | 'webp' {
  const m = uri.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  const e = (m?.[1] ?? 'jpg') as 'jpg' | 'jpeg' | 'png' | 'webp';
  return ['jpg', 'jpeg', 'png', 'webp'].includes(e) ? e : 'jpg';
}
