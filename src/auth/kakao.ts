/**
 * 카카오 로그인 wrapper.
 *
 * 실제 구현은 `@react-native-seoul/kakao-login` 네이티브 모듈 필요 (Expo dev client 빌드).
 * 이 파일은 인터페이스만 정의하고, 모듈이 없을 때는 안내 에러를 던진다.
 *
 * 실 사용 시:
 *   1) `npx expo install @react-native-seoul/kakao-login`
 *   2) app.json plugins 에 추가 + EAS dev client 빌드
 *   3) 아래 implementation 의 import 주석 해제
 */

export type KakaoTokenResult = {
  accessToken: string;
  // SDK 가 함께 주는 값들 (refreshToken, idToken 등) 은 백엔드 인증 시 불필요
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
