// 백엔드 기본 호스트 (fallback)
// - 실제 빌드: EAS 환경변수 EXPO_PUBLIC_API_BASE 가 항상 override
//   (production → api.farmily.info, preview/development → api.dev.farmily.info)
// - 이 fallback 은 EXPO_PUBLIC_API_BASE 미설정 시에만 사용됨
// - 주의: 로컬 개발 시 .env 의 EXPO_PUBLIC_API_BASE 를 localhost 로 설정하지 않으면
//         prod 백엔드(api.farmily.info)로 요청이 감
const DEFAULT_API_BASE = 'https://api.farmily.info';

const requireEnv = (key: string, fallback?: string) => {
  const v = process.env[key];
  if (!v && fallback === undefined) {
    console.warn(`[env] missing: ${key}`);
    return '';
  }
  return v ?? fallback ?? '';
};

export const env = {
  apiBase: requireEnv('EXPO_PUBLIC_API_BASE', DEFAULT_API_BASE),
  kakaoNativeKey: requireEnv('EXPO_PUBLIC_KAKAO_NATIVE_KEY', ''),
  // 카카오 REST API 키 — 웹 OAuth 흐름에서 인가 URL 의 client_id 로 사용 (NATIVE 키와 다름)
  kakaoRestKey: requireEnv('EXPO_PUBLIC_KAKAO_REST_KEY', ''),
  // 카카오 콘솔 + 백엔드 application-local.yml 의 redirect-uri 와 정확히 일치해야 함
  kakaoRedirectUri: requireEnv(
    'EXPO_PUBLIC_KAKAO_REDIRECT_URI',
    'http://localhost:3000/oauth/kakao',
  ),
  portoneImpCode: requireEnv('EXPO_PUBLIC_PORTONE_IMP_CODE', ''),
};
