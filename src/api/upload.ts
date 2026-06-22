import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
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

/**
 * 로컬 이미지(localUri)를 presigned URL 로 PUT 업로드한다.
 *
 * 웹: 브라우저 Blob 을 fetch 로 그대로 PUT.
 * 네이티브: RN 의 `fetch(file://...).blob()` → fetch PUT 은 신아키텍처에서 빈 바디(0 byte)로
 *   전송되는 함정이 있어, expo-file-system 의 File.upload(BINARY_CONTENT) 로 바이너리 직전송.
 *   네이티브 모듈은 웹 import 시점 throw 를 피하려고 분기 안에서만 require 한다
 *   (다운로드 경로 content/[id].tsx 와 동일한 컨벤션).
 */
export async function uploadToS3(uploadUrl: string, localUri: string, contentType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(localUri)).blob();
    const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
    if (!res.ok) throw new Error(`S3 PUT 실패: ${res.status}`);
    return;
  }

  const { File, UploadType } = require('expo-file-system') as typeof import('expo-file-system');
  const result = await new File(localUri).upload(uploadUrl, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    headers: { 'Content-Type': contentType },
    mimeType: contentType,
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`S3 PUT 실패: ${result.status}`);
  }
}

export function extOf(uri: string): 'jpg' | 'jpeg' | 'png' | 'webp' {
  const m = uri.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/);
  const e = (m?.[1] ?? 'jpg') as 'jpg' | 'jpeg' | 'png' | 'webp';
  return ['jpg', 'jpeg', 'png', 'webp'].includes(e) ? e : 'jpg';
}
