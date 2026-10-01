# Mobile 실행 기준

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
핵심 문구    영화의 순간을 모으다
앱 설명      영화와 함께 영화의 순간을 모으고 새로운 추억을 쌓아가는 공간
```

- 앱 이름·설명·아이콘·스플래시·스크린샷·키워드는 Expo 설정과 스토어 등록 정보에서 관리.
- 화면 안의 브랜드 문구도 `영화의 순간을 모으다`로 통일.
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
| iOS 도메인 검증 | `apple-app-site-association` | `대기중.site.cinemo.app` |

- `cinemo`는 사용자가 앱을 여는 커스텀 URL Scheme이고, `site.cinemo.app`은 앱 자체의 고유 식별자임.
- 두 값을 같은 것으로 취급하지 않음.
- 스토어 배포 이후 앱 식별자를 바꾸면 기존 앱과 다른 앱으로 인식될 수 있으므로 배포 전에 고정함.
- Apple Developer Team ID는 현재 `대기중`.
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
