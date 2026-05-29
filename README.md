# Farmily Mobile

Expo + React Native + TypeScript 기반 Farmily 모바일 앱.

## 스택
- Expo SDK 56
- React Native 0.85
- React 19
- TypeScript 6
- (예정) Expo Router, TanStack Query, Zustand, react-hook-form + zod, axios, expo-secure-store

## 처음 한 번
```bash
# 1) 클론
git clone https://github.com/urbanworkteam/Frontend.git
cd Frontend

# 2) 의존성 설치
npm install

# 3) 로컬 환경 파일 생성 (커밋 금지)
cp .env.example .env.local   # 파일 없으면 직접 만들기
```

`.env.local` 예시:
```
EXPO_PUBLIC_API_BASE=http://10.0.2.2:8080
EXPO_PUBLIC_KAKAO_NATIVE_KEY=
```

## 실행
```bash
npx expo start
# 안드로이드: a, iOS: i, 웹: w
```

Expo Go 앱 또는 Dev Client 로 실기기 테스트 가능.

## 환경 변수
`EXPO_PUBLIC_*` 접두사만 클라이언트 번들에 포함됩니다.

핵심 키 (docs repo 의 `docs/ENV.md` 참조):
- `EXPO_PUBLIC_API_BASE` — 백엔드 base URL
- `EXPO_PUBLIC_KAKAO_NATIVE_KEY` — 카카오 네이티브 키
- (선택) Firebase 푸시 설정 파일: `google-services.json` (Android), `GoogleService-Info.plist` (iOS) → 모두 `.gitignore` 처리됨

> **시크릿은 절대 git 에 커밋하지 않습니다.** `.gitignore` 가 `.env*`, FCM 설정 파일, keystore 등을 차단합니다.

## 개발 가이드
- spec: docs repo 의 `docs/specs/fe-mobile/` 폴더 (FE-000 ~ FE-SUB-002 등)
- 컨벤션: `docs/CONVENTIONS.md`
- API: `docs/API_SPEC.md`
- 디자인 토큰: `src/ui/tokens.ts` (FE-000 spec 참조)

## 배포
TBD (EAS Build 예정).
