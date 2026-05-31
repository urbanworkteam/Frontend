# Farmily Mobile

농민이 자기 농장 이야기를 소비자에게 전달하는 모바일 앱.
Expo + React Native + TypeScript 기반. 같은 백엔드를 쓰는 소비자 웹 (`Frontend-web`) + 백엔드 (`Backend`) 와 함께 동작합니다.

---

## 📦 스택

| 영역 | 사용 |
|---|---|
| 런타임 | Expo SDK 56 / React Native 0.85 / React 19 |
| 언어 | TypeScript 6 |
| 라우팅 | Expo Router (file-based) |
| 상태 | Zustand + TanStack Query |
| 폼/검증 | react-hook-form + zod |
| 인증 저장 | expo-secure-store |
| 결제 | PortOne (`iamport.js` 웹 / `react-native-webview` 모바일) |
| 위치 | expo-location (GPS + reverseGeocode) |
| 푸시 | expo-notifications (Android FCM, iOS 별도) |
| 카카오 로그인 | 웹: 표준 OAuth / 모바일: 네이티브 SDK (별도 PR) |

---

## 🚀 처음 한 번 (Quick Start)

### 1. 사전 준비
- **Node.js 20+** (Expo SDK 56 권장)
- **Git**
- (선택) Android 검증 시 — Android Studio + Pixel 에뮬레이터 (Google Play 포함 이미지)
- (선택) iOS 검증 시 — Xcode (macOS 만 가능)

### 2. 클론 + 설치
```bash
git clone https://github.com/urbanworkteam/Frontend.git
cd Frontend
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` 는 Expo SDK 56 + React 19 의 peer dep 충돌 회피용. **꼭 붙여주세요.**

### 3. 환경 변수 (`.env.local`)
프로젝트 루트에 `.env.local` 파일을 직접 만들어주세요 (`.gitignore` 처리됨).

```bash
# 백엔드 base URL — 미설정 시 Platform 별 default 사용
# 웹/iOS: http://localhost:8080
# Android 에뮬레이터: http://10.0.2.2:8080 (host 머신 alias)
# 비워두면 위 default 가 자동 적용됩니다.

# 카카오 REST API 키 (웹 OAuth — 인가 URL 의 client_id)
EXPO_PUBLIC_KAKAO_REST_KEY=

# 카카오 NATIVE 키 (모바일 SDK 용, 현재 미사용 — 모바일 카카오 SDK 도입 시점에 채움)
EXPO_PUBLIC_KAKAO_NATIVE_KEY=

# PortOne 가맹점 식별 코드 — 결제창 띄울 때 IMP.init() 인자
# 백엔드 application-local.yml 의 portone.imp-code 와 정확히 동일한 값
EXPO_PUBLIC_PORTONE_IMP_CODE=
```

각 키 발급처는 아래 [환경 변수 가이드](#-환경-변수-가이드) 참조.

### 4. 백엔드 띄우기 (한 번 셋업)
이 앱은 백엔드 (`urbanworkteam/Backend`) 에 의존합니다. 별도 폴더에 클론해서 도커로 띄우는 게 가장 빠름:

```bash
# 백엔드 레포 클론
cd ..
git clone https://github.com/urbanworkteam/Backend.git
cd Backend

# 도커로 인프라 + 백엔드 전부 실행
docker compose -f infra/docker/docker-compose.yml up -d

# 헬스 체크 — 200 이면 OK
curl http://localhost:8080/health
```

도커가 PostgreSQL + Redis + MinIO + 백엔드 4개를 한 번에 띄웁니다.
백엔드 환경변수 (카카오/KMA/PortOne) 는 백엔드 레포의 `application-local.yml` 에 적습니다.

### 5. 앱 실행
```bash
# 웹 (가장 빠른 검증 경로)
npx expo start --web --port 3000

# 모바일 (Expo Go 앱이 설치된 핸드폰에서 QR 스캔)
npx expo start

# Android 에뮬레이터 — 푸시까지 검증하려면 dev client 빌드 필요 (아래 참조)
```

브라우저에서 http://localhost:3000 접속.

---

## 🔑 환경 변수 가이드

### `EXPO_PUBLIC_KAKAO_REST_KEY`
- **어디서**: https://developers.kakao.com → 내 애플리케이션 → 앱 키 → **REST API 키**
- **왜**: 카카오 OAuth 의 `client_id`. 인가 URL 생성에 사용
- **주의**: NATIVE 키 / JavaScript 키 / Admin 키와 다른 값. **REST 키만 사용**
- **공유 가능**: 클라이언트 식별자라 공개돼도 무방 (`client_secret` 만 비밀)
- 백엔드 `application-local.yml:11` 의 `client-id` 와 **같은 값**이어야 합니다

### `EXPO_PUBLIC_PORTONE_IMP_CODE`
- **어디서**: https://admin.portone.io → 가맹점 식별코드
- **왜**: PortOne 결제창 띄울 때 `IMP.init(code)` 인자
- **주의**: 백엔드 `application-local.yml:29` 의 `portone.imp-code` 와 **반드시 동일**
- 무료 PortOne 가맹점이면 보통 INICIS 테스트 채널만 활성 → 실제 청구 안 됨

### `EXPO_PUBLIC_API_BASE` (선택)
- 미설정 시 Platform 별 default 자동 적용 (`src/config/env.ts`)
- 웹/iOS: `http://localhost:8080`
- Android 에뮬레이터: `http://10.0.2.2:8080`
- 실제 디바이스 + Wi-Fi 검증 시: `http://<PC의 LAN IP>:8080` 으로 override

> ⚠️ **`http://10.0.2.2:8080` 을 웹에서 사용하면 timeout 납니다** (Android 에뮬레이터 전용 alias). 웹 테스트 시 이 값으로 두지 마세요.

---

## 🔓 카카오 로그인 없이 개발하기 — dev-master

카카오 키가 없거나 OAuth 셋업이 부담스러우면 **dev-master 우회 로그인** 사용:

1. 로그인 화면 → "개발자 모드 (백엔드 카카오 code 직접 입력)" 토글
2. 텍스트박스에 `DEV_MASTER` 입력 → "dev 로그인"
3. 백엔드가 카카오 호출 없이 즉시 JWT 발급

이 흐름은 백엔드의 `AUTH_DEV_MASTER_ENABLED=true` + `AUTH_DEV_MASTER_CODE=DEV_MASTER` 환경변수가 활성일 때만 동작합니다. 도커 컴포즈는 기본 활성.

---

## 🌐 같이 띄워야 하는 것들

| 서비스 | 포트 | 어디서 | 어떻게 |
|---|---|---|---|
| 모바일 앱 (이 레포) | 3000 (웹) | `Frontend/` | `npx expo start --web --port 3000` |
| 소비자 웹 (디지털 명함) | 5173 | `Frontend-web/` | `npm run dev` |
| 백엔드 | 8080 | `Backend/` | `docker compose -f infra/docker/docker-compose.yml up -d` |
| PostgreSQL | 5432 | 도커 | (백엔드와 함께 자동) |
| MinIO (S3 호환) | 9000/9001 | 도커 | (백엔드와 함께 자동) |

세 레포 모두 같은 백엔드 (8080) 호출. 모바일 앱에서 편집한 명함이 소비자 웹에 즉시 반영됩니다.

---

## 📱 플랫폼별 동작 차이

| 기능 | 웹 | iOS (Expo Go) | Android (Expo Go) | dev client |
|---|---|---|---|---|
| 카카오 OAuth (웹 흐름) | ✅ | ❌ | ❌ | ❌ |
| 카카오 OAuth (네이티브 SDK) | ❌ | ⏳ 별도 PR | ⏳ 별도 PR | ✅ |
| GPS 위치 자동 감지 | ✅ (브라우저 권한) | ✅ | ✅ | ✅ |
| 결제 (PortOne) | ✅ (iamport.js) | ✅ (WebView) | ✅ (WebView) | ✅ |
| 푸시 알림 (FCM) | ❌ (skip) | ⏳ APNs 키 필요 | ❌ Expo Go 미지원 | ✅ Android |
| 일지 사진 업로드 | ✅ | ✅ | ✅ | ✅ |

푸시 검증은 **dev client 빌드** 필수입니다 (Expo Go ❌).

### dev client 빌드 (Android, 푸시 검증용)
```bash
# 옵션 A — 로컬 빌드 (Android Studio 필요)
npx expo prebuild --platform android
npx expo run:android

# 옵션 B — EAS 클라우드 빌드 (Android Studio 불필요)
npm install -g eas-cli
eas login
eas build --profile development --platform android
# 빌드 끝나면 QR 코드 → 핸드폰에 APK 설치
```

---

## 🌿 브랜치 전략

PR 마다 새 브랜치 만들지 않고 **고정 4개**만 사용합니다.

| 브랜치 | 용도 | 머지 대상 |
|---|---|---|
| `main` | 운영(릴리스) 기준. 직접 push 금지 | — |
| `dev` | 일반 개발/통합용 | `main` |
| `feat` | 신규 기능 작업 — **평소 여기서 작업** | `main` (또는 `dev`) |
| `hotfix` | 운영 긴급 패치 | `main` (필요시 `dev` 백포팅) |

### 작업 흐름
```bash
git checkout feat
git pull --ff-only origin feat

# 작업 후
git add ...
git commit -m "feat(scope): 한 줄 요약"
git push origin feat

# GitHub 에서 feat → main PR 생성 (.github/PULL_REQUEST_TEMPLATE.md 자동 적용)
```

PR 머지 후 `feat` 브랜치 동기화 — squash 머지라 fast-forward 안 되므로:
```bash
git fetch origin main
git reset --hard origin/main
git push origin feat --force-with-lease
```

> 임시 `chore/*`, `feature/*`, `fix/*` 브랜치는 만들지 않습니다.

### 커밋 메시지 (Conventional Commits)
```
feat(scope): 새 기능
fix(scope): 버그 수정
refactor(scope): 동작 변경 없는 리팩토링
chore: 빌드/설정/패키지 등
docs: 문서
test: 테스트
```

`scope` 예: `auth`, `diary`, `farm-location`, `subscription`, `notification`, `mypage` ...

---

## 🧰 자주 쓰는 명령어

```bash
# 타입 체크
npm run typecheck

# 린트
npm run lint

# Metro 캐시 정리 후 띄우기 (변경 안 반영될 때)
npx expo start --clear

# 패키지 설치 (peer dep 충돌 회피)
npx expo install <패키지> -- --legacy-peer-deps

# Android 빌드 직전 정리
npx expo prebuild --clean

# 도커 백엔드 재기동
cd ../Backend
docker compose -f infra/docker/docker-compose.yml restart backend
```

---

## 🩹 트러블슈팅

### "Cannot find native module 'ExpoXxxxx'" / 웹 부팅 시 throw
**원인**: native-only 모듈을 웹에서 import.
**해결**: 해당 모듈을 `Platform.OS !== 'web'` 분기로 lazy require. 패턴 예시:
```ts
const ModuleRef = Platform.OS !== 'web' ? require('react-native-webview') : null;
```

### `Web Bundling failed: Unable to resolve "react-native-worklets"`
**원인**: `expo-notifications` 설치 시 peer dep dedupe 로 같이 제거됨.
**해결**:
```bash
npx expo install react-native-worklets -- --legacy-peer-deps
```

### 카카오 로그인 — "KOE320" 등 redirect_uri 불일치
세 값이 정확히 같아야 합니다:
- 카카오 콘솔의 Redirect URI 등록값
- `.env.local` 의 `EXPO_PUBLIC_KAKAO_REDIRECT_URI` (미설정 시 default `http://localhost:3000/oauth/kakao`)
- 백엔드 `application-local.yml:13` 의 `redirect-uri`

### 백엔드 호출 timeout — 웹에서
- `EXPO_PUBLIC_API_BASE` 가 `http://10.0.2.2:8080` 으로 설정돼 있는지 확인 → 웹에선 그 alias 가 안 됨. 줄을 지우거나 `http://localhost:8080` 으로 변경

### Metro 가 stale 한 코드 캐시
```bash
# Metro 끝낸 다음
npx expo start --clear
```

### "Port 3000 is being used by another process"
```powershell
# PowerShell
Get-NetTCPConnection -LocalPort 3000 -State Listen | %{ Stop-Process -Id $_.OwningProcess -Force }
```

### `.env.local` 추가했는데 반영 안 됨
`EXPO_PUBLIC_*` 변수는 번들 시점에 inline 됩니다. **Metro 재시작 필수** (hot reload ❌).

---

## 📁 폴더 구조

```
app/                       Expo Router 라우트 (file-based)
  (auth)/login.tsx         로그인
  (auth)/onboarding.tsx    온보딩 (농장 정보 등록)
  (tabs)/diary/            영농일지 (목록/작성/상세)
  (tabs)/content/          AI 콘텐츠 생성
  (tabs)/profile/          명함 편집
  (tabs)/mypage/           마이페이지 (구독/결제/위치/작물/알림)
  oauth/kakao.tsx          카카오 OAuth 콜백
  _layout.tsx              루트 Stack + 푸시/인증 부팅

src/
  api/                     백엔드 호출 훅 (TanStack Query)
  auth/                    JWT 저장 + Zustand store + 카카오 SDK wrapper
  config/env.ts            환경변수 + Platform 별 default
  notification/push.ts     FCM 토큰 등록/해제 + 수신 핸들러
  screens/                 큰 화면 컴포넌트 모음
  state/                   Zustand 글로벌 store
  ui/                      디자인 토큰 + 공용 컴포넌트
  lib/                     공용 유틸

assets/                    이미지 / 아이콘
docs/                      작업 로그 + 컨벤션 + 스펙
.github/                   PR/이슈 템플릿
app.json                   Expo 설정 (plugins, permissions)
```

---

## 📚 추가 자료

- **개발 컨벤션**: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
- **API 스펙**: [`docs/API_SPEC.md`](docs/API_SPEC.md)
- **아키텍처**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **DB 스키마**: [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md)
- **일자별 작업 로그**: `docs/MM-DD/work-log.md`
- **백엔드 레포**: https://github.com/urbanworkteam/Backend
- **소비자 웹 레포**: https://github.com/urbanworkteam/Frontend-web

---

## ❓ 막히면

1. 위 [트러블슈팅](#-트러블슈팅) 먼저 확인
2. `docs/<MM-DD>/work-log.md` 의 최근 작업에서 비슷한 이슈 해결 사례 검색
3. Slack `#farmily-frontend` 채널에 질문
