/**
 * 카카오 로그인 wrapper.
 *
 * - **모바일**: `@react-native-seoul/kakao-login` 네이티브 모듈 (Expo dev client 필요)
 * - **웹**: 브라우저 OAuth 흐름 — 인가 URL 로 리디렉트 → 콜백 라우트(`/oauth/kakao`)에서 code 처리
 */

import { env } from '@/config/env';

export type KakaoTokenResult = {
  accessToken: string;
};

export async function loginWithKakao(): Promise<KakaoTokenResult> {
  // 실제 코드 (네이티브 모듈 설치 후 활성화):
  // import KakaoLogin from '@react-native-seoul/kakao-login';
  // const r = await KakaoLogin.login();
  // return { accessToken: r.accessToken };
  throw new Error(
    '카카오 SDK 미설치. `@react-native-seoul/kakao-login` 추가 + dev client 빌드 후 src/auth/kakao.ts 의 구현을 활성화하세요.',
  );
}

export async function logoutFromKakao(): Promise<void> {
  // import KakaoLogin from '@react-native-seoul/kakao-login';
  // await KakaoLogin.logout();
}

const KAKAO_STATE_KEY = 'kakao_oauth_state';

function randomState(): string {
  // 웹: crypto.getRandomValues. 일부 구식 브라우저 미지원 시 Math.random fallback.
  const g = typeof globalThis !== 'undefined' ? (globalThis as any) : ({} as any);
  if (g.crypto?.getRandomValues) {
    const arr = new Uint8Array(16);
    g.crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * 웹 카카오 OAuth 인가 URL 생성 + state 토큰 sessionStorage 보관.
 * 호출 측에서 `window.location.href = ...` 으로 리디렉트.
 */
export function buildKakaoAuthUrl(): string {
  if (!env.kakaoRestKey) {
    throw new Error(
      '카카오 REST API 키가 설정되지 않았어요. .env.local 의 EXPO_PUBLIC_KAKAO_REST_KEY 를 확인해주세요.',
    );
  }
  const state = randomState();
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.setItem(KAKAO_STATE_KEY, state);
  }
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.kakaoRestKey,
    redirect_uri: env.kakaoRedirectUri,
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

/**
 * 콜백 라우트에서 호출 — 인가 시 저장한 state 와 URL 의 state 가 일치하는지 검증 (CSRF 방어).
 */
export function consumeKakaoState(returned: string | undefined): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return true; // SSR/네이티브: 검증 생략
  const saved = window.sessionStorage.getItem(KAKAO_STATE_KEY);
  window.sessionStorage.removeItem(KAKAO_STATE_KEY);
  if (!saved) return false;
  return saved === returned;
}
