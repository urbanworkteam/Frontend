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

## 브랜치 전략

PR 마다 새 브랜치를 만들지 않고, 아래 **4개의 고정 브랜치**만 사용합니다.

| 브랜치 | 용도 | 머지 대상 |
| --- | --- | --- |
| `main` | 운영(릴리스) 기준 브랜치. **직접 push 금지** | — |
| `dev` | 일반 개발/통합용. 평소 작업의 기본 브랜치 | `main` |
| `feat` | 신규 기능 작업 | `dev` 또는 `main` |
| `hotfix` | 운영 긴급 패치 | `main` (필요 시 `dev` 에도 백포팅) |

### 작업 흐름
```bash
# 1) 작업할 고정 브랜치로 이동
git checkout feat            # 신규 기능
git pull --ff-only origin feat

# 2) 작업 후 커밋 → push
git add ...
git commit -m "feat(...): ..."
git push origin feat

# 3) GitHub 에서 feat → main (또는 dev) 로 PR 생성
#    PR 본문은 .github/PULL_REQUEST_TEMPLATE.md 양식에 맞춰 작성
```

> 임시 `chore/*`, `feature/*`, `fix/*` 등의 일회성 브랜치는 만들지 않습니다. PR 도 위 4개 브랜치 중 하나에서 발사합니다.

### 이슈/PR 템플릿
- 이슈: `.github/ISSUE_TEMPLATE/bug.md`, `.github/ISSUE_TEMPLATE/feature.md`
- PR: `.github/PULL_REQUEST_TEMPLATE.md` (PR 생성 시 자동 적용)

## 배포
TBD (EAS Build 예정).
