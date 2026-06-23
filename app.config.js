// EAS 클라우드 빌드에서는 google-services.json 이 git 에 없으므로
// EAS 파일 환경변수(GOOGLE_SERVICES_JSON)로 주입받는다.
// 로컬에서는 기존 ./google-services.json 을 그대로 사용한다.
//
// 카카오 네이티브 SDK 플러그인도 여기서 주입한다 — 네이티브 앱 키를 git 에 박지 않고
// EXPO_PUBLIC_KAKAO_NATIVE_KEY 환경변수로 받는다. 이 플러그인이 prebuild 시
// iOS CFBundleURLSchemes(kakao{KEY}) / Android AuthCodeHandlerActivity intent-filter 를 자동 주입.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
  plugins: [
    ...(config.plugins ?? []),
    [
      '@react-native-seoul/kakao-login',
      {
        // 빈 문자열 fallback — 키 미설정 시 prebuild 가 strings.xml 단계에서 하드 크래시하지 않도록.
        // 실제 빌드에서는 EAS 환경변수 EXPO_PUBLIC_KAKAO_NATIVE_KEY 가 주입됨.
        kakaoAppKey: process.env.EXPO_PUBLIC_KAKAO_NATIVE_KEY ?? '',
        // 플러그인 기본값(1.5.10)이 Expo SDK 56 의 android.kotlinVersion 을 덮어써서
        // `expo-root-project`(Kotlin >= 2.1.20 요구)가 gradle 단계에서 실패함 → SDK 56 버전으로 고정.
        kotlinVersion: '2.1.20',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          extraMavenRepos: ['https://devrepo.kakao.com/nexus/content/groups/public/'],
        },
      },
    ],
  ],
});
