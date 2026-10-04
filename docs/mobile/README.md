# Mobile 실행 기준

## YouTube 예고편 WebView 오류 해결 기록

### 문제

- Mobile에서 예고편 모달은 열리지만 YouTube WebView에서 `152-4` 오류가 발생함.
- `externalId` 조회와 모달 상태 변경에는 문제가 없었음.
- `externalId`는 YouTube 전체 URL이 아니라 영상 키임.

```text
externalId: zz2ZH13NOi8
```

### 원인 확인 과정

1. `watch?v=...` 주소를 WebView 재생 주소로 사용하지 않음.
2. HTML 내부에 YouTube iframe을 중첩하는 방식에서 오류가 계속 발생함.
3. `onMessage`에는 주입 스크립트가 아니라 메시지 처리 함수를 전달해야 함.
4. 임의의 User-Agent 위장은 제거함. Native WebView의 기본 클라이언트 정보를 유지해야 함.

### 현재 해결 방식

`externalId`를 영상 키로 사용해 `embed` URL을 직접 생성하고, WebView의 `source.uri`로 전달함.

```tsx
const embedUrl =
  `https://www.youtube.com/embed/${encodeURIComponent(videoKey)}` +
  "?autoplay=1&playsinline=1&rel=0";

<WebView
  source={{ uri: embedUrl }}
  javaScriptEnabled
  domStorageEnabled
  allowsInlineMediaPlayback
  allowsFullscreenVideo
  mediaPlaybackRequiresUserAction={false}
/>
```

- `watch?v=...` 주소는 WebView 재생용으로 사용하지 않음.
- `watch?v=...` 주소는 사용자가 YouTube에서 직접 확인해야 할 때만 사용.
- 모달은 전체 화면으로 표시하고, 닫기 버튼은 safe area 안쪽에 직접 배치함.
- 관련 구현: `apps/mobile/components/lobby/MovieRanking.tsx`
- 관련 UI: `apps/mobile/components/lobby/MovieTrailerDialog.tsx`

## 0. 앱 경로·ASO·딥링크 기준

### Expo Router 경로

```text
app/index.tsx       # Intro/Entry: 중앙 로고·브랜드 문구
app/lobby.tsx       # CINEMO LOBBY: 앱 메인 화면
app/movies/[id].tsx # 영화 상세: CINEMO 내부 Movie.id 사용
```

- 앱 최초 진입 화면은 Intro/Entry임.
- Intro/Entry가 끝나면 `/lobby`로 이동.
- `/lobby`가 메인 화면이며 영화 상세는 `/movies/[id]`로 이동.
- `[id]`에는 KOBIS·TMDB·KMDb 외부 식별자가 아니라 CINEMO 내부 영화 ID를 사용.

### Mobile ASO

Mobile은 검색엔진 SEO가 아니라 App Store·Google Play 노출을 위한 ASO를 적용.

```text
앱 이름      CINEMO
핵심 문구    영화 속으로, 추억의 한 장면으로
앱 설명      좋아하는 영화와 함께 새로운 추억을 쌓아가는 공간
```

- 앱 이름·설명·아이콘·스플래시·스크린샷·키워드는 Expo 설정과 스토어 등록 정보에서 관리.
- 화면 안의 브랜드 문구도 `영화 속으로, 추억의 한 장면으로`로 통일.
- Web SEO metadata와 Mobile ASO metadata는 플랫폼별 설정에 두고, 문구만 동일하게 유지.

### Mobile icon·splash·Intro 구분

```text
앱 실행
  ↓
Native Splash
  ↓
Expo Router·JavaScript 로딩
  ↓
Intro/Entry 화면
  ↓
CINEMO Lobby
```

| 항목 | 파일·설정 | 역할 |
| --- | --- | --- |
| App Icon | `assets/icon.png`, `expo.icon` | 홈 화면·앱 목록에 표시되는 앱 아이콘 |
| Native Splash | `assets/splash.png`, `expo.splash` | JavaScript 화면이 준비되기 전 잠시 표시되는 시작 이미지 |
| Intro/Entry | `app/index.tsx` | 앱 로딩 후 React가 보여주는 브랜드 진입 화면 |

- App Icon은 앱 설치 후 홈 화면과 앱 목록에서 사용.
- Native Splash는 앱 실행 직후 네이티브 로딩 구간에서만 사용.
- Intro/Entry는 Native Splash가 끝난 뒤 Expo Router가 표시하는 실제 화면.
- Web에는 Mobile의 `expo.splash` 설정을 적용하지 않음.
- Native Splash와 Intro/Entry를 같은 화면으로 취급하지 않음.

### Mobile UI 컴포넌트 기준

Web과 Mobile은 같은 CINEMO 디자인 방향을 사용하지만, 플랫폼의 UI primitive가 다르므로 컴포넌트 구현은 분리함.

| 구분 | Web | Expo Mobile |
| --- | --- | --- |
| 스타일 | Tailwind CSS | Tailwind CSS v4 + NativeWind v5 RC `className` |
| UI 컴포넌트 | shadcn/ui·Base UI | React Native Reusables |
| 버튼 primitive | `button` | `Pressable` 기반 컴포넌트 |
| 모달 primitive | Web Dialog | React Native Dialog·Portal |
| 아이콘 | `lucide-react` | `lucide-react-native` |
| 데이터·API·타입 | CINEMO API | CINEMO API를 동일하게 사용 |

#### React Native Reusables 선택 이유

Expo에서 shadcn/ui와 유사한 방식으로 컴포넌트 소스를 프로젝트에 추가하고 직접 수정할 수 있는 선택지임. CINEMO의 골드·블루그린 색상, 버튼 상태, 모달 스타일을 앱 요구사항에 맞게 조정하기 쉬움.

- 공식 `shadcn/ui`는 Web용이므로 Expo에서 직접 사용하지 않음.
- React Native Reusables는 전체 UI를 한 번에 설치하지 않고 필요한 컴포넌트만 추가함.
- 우선 `Dialog`를 추가해 예고편 모달에 적용함.
- 컴포넌트 추가 전 NativeWind와 Portal 설정을 먼저 확인함.
- Web과 Mobile은 색상·간격·문구·데이터 구조를 공유하고, 실제 렌더링 컴포넌트는 플랫폼별로 작성함.

```text
공통 API·타입·디자인 토큰
            ↓
Web: shadcn/ui + Tailwind CSS
            ↓
Mobile: React Native Reusables + NativeWind
```

## NativeWind·Tailwind CSS 버전 기준

Expo Mobile은 Web과 같은 Tailwind CSS v4 계열을 사용함. React Native에서 Tailwind 문법을 사용하기 위한 NativeWind는 v5 RC 기준으로 구성.

| 항목 | 버전·설정 | 역할 |
| --- | --- | --- |
| Tailwind CSS | `4.1.12` | CSS-first 유틸리티 생성 |
| NativeWind | `5.0.0-rc.0` | `className`을 React Native 스타일로 변환 |
| react-native-css | `3.1.0-rc.0` | NativeWind v5의 CSS 처리 엔진 |
| PostCSS | `8.5.28` | Tailwind v4 PostCSS 플러그인 실행 |
| `@tailwindcss/postcss` | `4.1.12` | Tailwind v4 PostCSS 연동 |
| lightningcss | `1.30.1` | CSS 변환·최적화 |

### Tailwind v4 CSS 진입점

Tailwind v3의 `@tailwind base`, `@tailwind components`, `@tailwind utilities` 문법을 사용하지 않음. `apps/mobile/global.css`에서 CSS `@import` 방식으로 Tailwind 레이어를 불러옴.

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
```

### NativeWind v5 설정 파일

| 파일 | 기준 |
| --- | --- |
| `apps/mobile/babel.config.js` | `babel-preset-expo`만 유지하고 v4의 `nativewind/babel`, `jsxImportSource` 제거 |
| `apps/mobile/metro.config.js` | `withNativewind(config)`으로 Metro 설정 감싸기 |
| `apps/mobile/postcss.config.mjs` | `@tailwindcss/postcss` 등록 |
| `apps/mobile/nativewind-env.d.ts` | `react-native-css/types` 타입 참조 |
| `apps/mobile/app/_layout.tsx` | 최상위 레이아웃에서 `global.css`를 한 번만 import |

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
```

`withNativeWind`처럼 `W`가 대문자인 이름은 v5에서 deprecated alias임. 새 코드에서는 `withNativewind`를 사용함.

### v4에서 변경된 컴포넌트 연결 방식

NativeWind v5 RC는 `cssInterop`과 `remapProps`를 공개 API로 사용하지 않음. 아이콘처럼 `className`을 특정 React Native 스타일 속성으로 연결해야 하는 컴포넌트는 `styled`와 `nativeStyleMapping`을 사용함.

```tsx
const StyledIcon = styled(IconComponent, {
  className: {
    target: 'style',
    nativeStyleMapping: {
      height: true,
      width: true,
    },
  },
});
```

### 설치·검증 명령

```bash
pnpm --filter @cinemo/mobile typecheck
pnpm --filter @cinemo/mobile exec expo export --platform web --output-dir /tmp/cinemo-mobile-export
```

- 타입 검사와 Expo Web export가 모두 통과해야 마이그레이션 완료로 판단.
- NativeWind v5는 RC(pre-release)이므로 NativeWind 버전이 안정화되면 별도 업그레이드 검토가 필요.

### 딥링크 규칙

```text
cinemo://lobby
cinemo://movies/{movieId}
```

- Lobby 딥링크는 앱의 `/lobby`로 연결.
- 영화 딥링크는 앱의 `/movies/[id]`로 연결.
- 외부 provider ID가 아닌 CINEMO 내부 `Movie.id`를 사용.
- 추후 Universal Links·Android App Links를 연결할 때 Web의 `/movies/{movieId}`와 같은 영화 상세 대상을 사용.

### 앱 식별자와 웹 링크 연결

앱 스토어와 운영체제가 CINEMO 앱을 식별할 때 사용하는 값은 도메인 역순 기반의
`site.cinemo.app`으로 통일함.

| 용도 | 설정 위치 | 값 |
| --- | --- | --- |
| iOS 앱 식별자 | `ios.bundleIdentifier` | `site.cinemo.app` |
| Android 앱 식별자 | `android.package` | `site.cinemo.app` |
| Android 도메인 검증 | `assetlinks.json` | `package_name: site.cinemo.app` |
| iOS 도메인 검증 | `apple-app-site-association` | `9ZXPC6JNMT.site.cinemo.app` |

- `cinemo`는 사용자가 앱을 여는 커스텀 URL Scheme이고, `site.cinemo.app`은 앱 자체의 고유 식별자임.
- 두 값을 같은 것으로 취급하지 않음.
- 스토어 배포 이후 앱 식별자를 바꾸면 기존 앱과 다른 앱으로 인식될 수 있으므로 배포 전에 고정함.
- Apple Developer Team ID는 `9ZXPC6JNMT`로 등록함.
- Android 배포 인증서의 SHA-256 지문은 현재 `대기중`.

## 1. Expo 개발 서버

```bash
pnpm dev:mobile
```

Expo Metro 개발 서버 실행. Expo Go 또는 연결된 개발 환경에서 확인.

## 2. iOS 네이티브 실행

```bash
pnpm --filter @cinemo/mobile ios
```

내부적으로 `expo run:ios` 실행. iOS Simulator 또는 연결된 개발 기기에 네이티브 빌드 설치.

```text
pnpm --filter @cinemo/mobile ios
        ↓
expo run:ios
        ↓
iOS 네이티브 빌드
        ↓
Simulator·실제 iPhone 실행
```

## 3. API 주소

iOS Simulator에서는 Mac의 `localhost` 접근 가능.

```ini
# iOS Simulator
EXPO_PUBLIC_API_URL=http://localhost:3050
```

실제 iPhone에서는 Mac의 로컬 IP 사용.

```ini
# 실제 iPhone
EXPO_PUBLIC_API_URL=http://192.168.x.x:3050
```

- iPhone과 Mac이 같은 Wi-Fi에 연결되어야 함.
- API 서버가 외부 접속 가능한 주소에서 실행되어야 함.
- 환경변경 후 Expo 개발 서버 재시작.
- API 호출 경로는 `/v1` 버전을 포함.

```text
GET ${EXPO_PUBLIC_API_URL}/v1/health
```

## 4. Web·Mobile 확인 순서

```text
API 실행
    ↓
GET /v1/health 직접 확인
    ↓
Web에서 API 호출 확인
    ↓
Expo 개발 서버 확인
    ↓
iOS 네이티브 실행 확인
    ↓
영화 기능 연결
```

Health API 응답 예시:

```json
{
  "status": "ok",
  "timestamp": "2026-09-29T12:00:00.000Z"
}
```
