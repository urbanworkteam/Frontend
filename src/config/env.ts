const requireEnv = (key: string, fallback?: string) => {
  const v = process.env[key];
  if (!v && fallback === undefined) {
    console.warn(`[env] missing: ${key}`);
    return '';
  }
  return v ?? fallback ?? '';
};

export const env = {
  apiBase: requireEnv('EXPO_PUBLIC_API_BASE', 'http://10.0.2.2:8080'),
  kakaoNativeKey: requireEnv('EXPO_PUBLIC_KAKAO_NATIVE_KEY', ''),
  portoneImpCode: requireEnv('EXPO_PUBLIC_PORTONE_IMP_CODE', ''),
};
