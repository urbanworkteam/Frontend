import { Platform } from 'react-native';

// Platform 별 백엔드 기본 호스트
// - web / iOS: localhost (둘 다 호스트 머신에서 직접 접근)
// - Android 에뮬레이터: 10.0.2.2 (에뮬레이터에서 호스트 머신을 가리키는 alias)
// - 실 디바이스 / production: EXPO_PUBLIC_API_BASE 환경변수로 override
const DEFAULT_API_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

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
  portoneImpCode: requireEnv('EXPO_PUBLIC_PORTONE_IMP_CODE', ''),
};
