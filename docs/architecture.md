# CINEMO 아키텍처 기준

## 1. 기본 구조

```text
cinemo-final/
├── apps/
│   ├── api/                         # NestJS API + Prisma
│   │   ├── prisma/                  # schema·migration
│   │   ├── src/
│   │   │   ├── common/              # 전역 예외·필터·공통 기능
│   │   │   │   ├── exceptions/
│   │   │   │   └── filters/
│   │   │   ├── config/              # 환경변수·설정
│   │   │   ├── prisma/              # PrismaModule·PrismaService
│   │   │   ├── integrations/        # 외부 API adapter
│   │   │   │   ├── kobis/           # KOBIS 연동·원본 응답 변환
│   │   │   │   │   ├── dto/
│   │   │   │   │   ├── types/
│   │   │   │   │   └── mappers/
│   │   │   │   ├── tmdb/            # TMDB 연동·원본 응답 변환
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── types/
│   │   │   │   └── kmdb/            # KMDb 연동·원본 응답 변환
│   │   │   │       ├── dto/
│   │   │   │       ├── types/
│   │   │   │       └── mappers/
│   │   │   ├── modules/             # 기능 단위 모듈
│   │   │   │   ├── movies/          # 영화 조회·검색·외부 데이터 보강
│   │   │   │   ├── lobby/           # 첫 화면 Featured 데이터 조합 API
│   │   │   │   ├── map/             # 영화관 장소·지역 검색 API
│   │   │   │   └── admin/           # 영화 데이터 운영·검토 API
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── prisma.config.ts
│   ├── mobile/                      # Expo Router 모바일 앱
│   │   ├── app/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx            # 중앙 로고·문구가 있는 Intro/Entry
│   │   │   ├── lobby.tsx             # CINEMO LOBBY
│   │   │   ├── search.tsx           # 영화 통합 검색
│   │   │   └── movies/[id].tsx      # 영화 상세
│   │   ├── lib/
│   │   │   └── api/                 # Mobile API 요청 함수
│   │   └── assets/
│   │       └── fonts/
│   └── web/                         # Next.js App Router 웹 앱
│       └── app/
│           ├── page.tsx             # 중앙 로고·문구가 있는 Intro/Entry
│           ├── lobby/
│           │   └── page.tsx         # CINEMO LOBBY
│           └── fonts/
├── packages/
│   ├── api-contract/                # OpenAPI 생성 HTTP 계약 타입
│   │   └── src/
│   │       ├── generated/           # Codegen 자동 생성 파일
│   │       └── index.ts             # Web·Mobile 공개 export
│   └── shared/                      # 순수 타입·상수·유틸
│       └── src/
│           ├── theme/               # 공통 디자인 토큰
│           └── index.ts
├── docs/                            # 로컬 설계·주의사항 문서
│   ├── error-handling/              # Custom Exception·전역 에러 응답 규칙
│   ├── kobis/                       # KOBIS 원본 응답·변환 규칙
│   ├── tmdb/                        # TMDB 원본 응답·이미지·영상·보강 규칙
│   ├── kmdb/                        # KMDb 원본 응답·검색·보강 규칙
│   ├── movie/                       # 영화 도메인 모델·연결 관계
│   ├── user/                        # 사용자·인증·세션 구조
│   ├── map/                         # 영화관 장소·지역 검색 구조
│   ├── mobile/                      # Expo·iOS 네이티브 실행 규칙
│   └── admin/                       # 관리자 운영·분석·이력 구조
└── docker-compose.yml               # 로컬 PostgreSQL
```



### Intro·Lobby 화면 규칙

- Web과 Mobile의 첫 진입은 중앙 로고와 CINEMO 문구를 보여주는 `Intro/Entry` 화면으로 통일.
- Intro/Entry는 브랜드 진입 화면이며 영화 목록이나 Lobby 데이터를 직접 조합하지 않음.
- Mobile은 앱 시작 후 `index.tsx` Intro/Entry를 표시하고, Web은 `/` Intro/Entry를 표시.
- Intro/Entry가 끝나면 Web `/lobby`, Mobile `/lobby`의 CINEMO LOBBY로 이동.
- API의 `lobby` 모듈이 Lobby에 필요한 Featured·현재 상영작·예정작·인기 영화 데이터를 조합.
- Web과 Mobile은 같은 Lobby API를 사용하지만 화면 컴포넌트는 플랫폼별로 분리.
- 브랜드 문구·색상·폰트 토큰처럼 순수한 값만 `packages/shared`에서 공유.
- Web과 Mobile의 화면 컴포넌트는 공유하지 않음. 플랫폼별 렌더링·접근성·네비게이션 방식이 다르기 때문.
- Lobby 화면에서 영화 데이터를 직접 조합하지 않고 API 응답을 사용.



### 플랫폼 경로 규칙

Web과 Mobile은 같은 화면 흐름과 영화 식별 규칙을 사용하되, 라우터 문법은 플랫폼에 맞게 분리.


| 기능           | Web 경로         | Mobile Expo Router 경로 | 역할                                     |
| ------------ | -------------- | --------------------- | -------------------------------------- |
| Intro/Entry  | `/`            | `/`                   | 중앙 로고와 `영화의 순간을 모으다` 문구를 보여주는 최초 진입 화면 |
| CINEMO LOBBY | `/lobby`       | `/lobby`              | Featured·현재 상영작·예정작·인기 영화를 보여주는 메인 화면  |
| 영화 상세        | `/movies/[id]` | `/movies/[id]`        | CINEMO 내부 영화 ID로 상세 정보를 조회하는 화면        |


- `/lobby`가 메인 화면이며 `/movies/[id]`가 메인 화면을 대체하지 않음.
- `/movies/[id]`의 `id`는 KOBIS·TMDB·KMDb 외부 ID가 아니라 CINEMO 내부 `Movie.id`임.
- `slug`는 영화 제목을 URL에 읽기 쉽게 표현한 문자열이지만, 제목 중복·변경 가능성이 있어 현재는 사용하지 않음.
- 현재 영화 상세 URL은 가독성보다 정확한 식별을 우선해 `/movies/{movieId}` 형태로 유지.
- Web의 `/`는 Intro/Entry를 보여준 뒤 `/lobby`로 이동.
- Mobile의 `app/index.tsx`는 Intro/Entry를 보여준 뒤 `/lobby`로 이동.
- Web·Mobile 모두 영화 상세 URL은 `/movies/{movieId}` 형태로 통일.



### Web SEO·Mobile ASO 규칙



#### Web SEO

Web은 Next.js Metadata API를 사용해 검색엔진이 페이지의 제목·설명·대표 URL을 이해하도록 구성.

```text
apps/web/app/layout.tsx       # 전체 기본 metadata
apps/web/app/robots.ts         # /robots.txt 생성
apps/web/app/sitemap.ts        # /sitemap.xml 생성
apps/web/app/lobby/page.tsx    # Lobby 페이지 metadata
apps/web/app/movies/[id]/page.tsx # 영화별 동적 metadata
```

- 기본 브랜드 문구는 `영화의 순간을 모으다`로 통일.
- `/`와 `/lobby`는 공개 SEO 대상.
- `/movies/[id]`는 공개된 영화만 sitemap에 포함.
- `/api/`, `/admin/`처럼 검색엔진에 노출할 필요가 없는 경로는 `robots.ts`에서 제외.
- `sitemap.ts`는 `/v1/movies/sitemap`에서 공개 영화의 `id`, `updatedAt`을 받아 영화 상세 URL을 동적으로 생성.
- 영화 상세 metadata는 영화 제목·줄거리·대표 포스터를 사용해 `generateMetadata`로 생성.
- canonical URL은 Web의 `/movies/{movieId}`를 기준으로 관리.

```text
DB의 공개 영화
      ↓
GET /v1/movies/sitemap
      ↓
apps/web/app/sitemap.ts
      ↓
/sitemap.xml
      ↓
검색엔진이 /movies/{movieId} 수집
```

환경변수 기준:

```ini
NEXT_PUBLIC_SITE_URL=http://localhost:3051
NEXT_PUBLIC_API_URL=http://localhost:3050
```

- `NEXT_PUBLIC_SITE_URL`은 canonical·Open Graph·sitemap URL 생성에 사용.
- `NEXT_PUBLIC_API_URL`은 Web 서버가 sitemap용 영화 목록을 조회할 때 사용.
- API key나 DB 접속 정보는 `NEXT_PUBLIC_` 환경변수에 넣지 않음.



#### 비공개 페이지의 noindex 규칙

검색엔진에 노출하면 안 되는 페이지는 공개 SEO 대상에서 제외.


| 대상           | 처리 위치                         | 목적                      |
| ------------ | ----------------------------- | ----------------------- |
| `/admin/*`   | `robots.ts`의 `disallow`       | 관리자 경로 크롤링 차단           |
| `/login`     | 페이지 metadata의 `noindex`       | 로그인 화면을 검색 결과에서 제외      |
| `/account/*` | 해당 layout metadata의 `noindex` | 개인 정보·설정 화면을 검색 결과에서 제외 |


```ts
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

- `disallow`는 검색엔진의 크롤링을 막는 규칙.
- `noindex`는 페이지를 읽더라도 검색 결과에 포함하지 않는 규칙.
- `robots.txt`로 막힌 페이지는 검색엔진이 `noindex`를 읽을 수 없으므로 두 규칙을 같은 의미로 사용하지 않음.
- 관리자처럼 외부 공개 자체가 필요 없는 경로는 `robots.ts`에서 차단.
- 로그인·개인정보·설정 페이지처럼 접근은 가능하지만 검색 결과에 노출하면 안 되는 페이지는 `noindex` 사용.
- 실제 페이지가 만들어지는 시점에 해당 route 또는 route group layout에 `noindex`를 추가.



#### SEO metadata 확인 방법

Next.js가 서버에서 생성한 metadata는 실제 HTML의 `<head>`에서 확인.

영화 상세 페이지 기준:

```text
http://localhost:3051/movies/{movieId}
```

주소 앞에 `view-source:`를 붙이면 브라우저가 받은 원본 HTML을 확인할 수 있음.

```text
view-source:http://localhost:3051/movies/{movieId}
```

다음 태그를 검색해 확인.

```html
<title>
<meta name="description">
<link rel="canonical">
<meta property="og:title">
<meta property="og:description">
<meta property="og:image">
```

- `title`: 브라우저 탭 제목·검색 결과 제목
- `description`: 검색 결과 설명
- `canonical`: 대표 URL
- `og:title`, `og:description`, `og:image`: SNS 공유 미리보기 정보
- 개발자도구에서는 `Elements` 탭의 `<head>` 안에서도 같은 내용을 확인할 수 있음.



#### 로딩 UI 규칙

로딩 화면은 기능마다 임시 마크업을 반복하지 않고, 공통 `Skeleton` 컴포넌트를 만든 뒤 적용.

- 현재 영화 상세 `loading.tsx` 구현은 보류.
- 나중에 포스터·제목·장르·출연진 영역별 Skeleton을 공통 컴포넌트로 구성.
- Web과 Mobile은 플랫폼별 렌더링 방식이 다르므로 Skeleton 컴포넌트는 각각 구현.
- 실제 응답 구조와 화면 레이아웃이 확정된 뒤 로딩 UI를 추가.



#### NotFound UI 규칙

NotFound 화면의 의미와 브랜드 표현은 Web·Mobile에서 공통으로 유지하고, 플랫폼별 UI 구현만 분리.


| 공통으로 유지                          | 플랫폼별로 구현                                |
| -------------------------------- | --------------------------------------- |
| 상태 의미: `MOVIE_NOT_FOUND`         | Web `not-found.tsx`                     |
| 제목: `영화를 찾을 수 없습니다.`             | Mobile `+not-found.tsx` 또는 화면별 fallback |
| 설명: `요청한 영화가 없거나 아직 등록되지 않았습니다.` | Web `Link`                              |
| 이동 대상: `/lobby`                  | Mobile `router.push("/lobby")`          |
| 배경·텍스트·버튼 색상 토큰                  | `div`·`View`·`Text` 등 플랫폼 UI 컴포넌트       |


- 공통 문구·상태값·색상 토큰은 `packages/shared`에서 관리할 수 있음.
- Web과 Mobile은 같은 의미와 시각적 방향을 사용하되 실제 컴포넌트는 각 플랫폼에서 작성.
- NotFound 화면을 공통 컴포넌트로 억지로 합치지 않음. Web과 Mobile의 라우팅·접근성·UI primitive가 다르기 때문.



#### Mobile ASO·딥링크

Mobile은 검색엔진 SEO가 아니라 App Store·Google Play 노출을 위한 ASO를 적용.

```text
앱 표시 이름       CINEMO
앱 핵심 문구       영화의 순간을 모으다
앱 설명            영화와 함께 영화의 순간을 모으고 새로운 추억을 쌓아가는 공간
```

- 앱 이름·설명·아이콘·스플래시·스크린샷·키워드는 Expo 설정과 스토어 등록 정보에서 관리.
- Mobile 내부 화면 경로는 Expo Router가 관리.
- 앱 내부 딥링크는 `cinemo://lobby`, `cinemo://movies/{movieId}` 형태로 통일.
- 웹 링크와 앱 링크를 연결할 때도 영화 식별자는 CINEMO 내부 `Movie.id` 사용.
- 나중에 Universal Links·Android App Links를 연결할 때 Web의 `/movies/{movieId}`를 앱의 영화 상세 화면으로 연결.

앱 식별자는 도메인 역순 기반의 `site.cinemo.app`으로 통일.

| 구분 | 설정 |
| --- | --- |
| iOS `bundleIdentifier` | `site.cinemo.app` |
| Android `package` | `site.cinemo.app` |
| Android `assetlinks.json` | `package_name: site.cinemo.app` |
| iOS `apple-app-site-association` | `대기중.site.cinemo.app` |

- `cinemo`는 커스텀 URL Scheme이고, `site.cinemo.app`은 앱의 고유 식별자임.
- 앱 식별자는 스토어 배포 후 변경하지 않음. 변경하면 기존 앱과 다른 앱으로 인식될 수 있음.
- Apple Developer Team ID는 현재 `대기중`.
- Android SHA-256 인증서 지문은 현재 `대기중`.
- ASO용 문구와 화면의 브랜드 문구는 `영화의 순간을 모으다`로 통일하되, 실제 UI 컴포넌트는 Web·Mobile에서 각각 구현.

```text
Web / 또는 Mobile 앱 시작
          ↓
Intro/Entry: 중앙 로고·문구
          ↓
CINEMO LOBBY
          ↓
Lobby API: Featured·현재 상영작·예정작·인기 영화
```



## 2. 의존성 방향

```text
mobile/web → api-contract, shared
api        → api-contract, shared
api        → integrations, Prisma
mobile/web ↛ Prisma
mobile/web ↛ 외부 API 직접 호출
```

- Prisma는 `apps/api`에서만 사용.
- 외부 API key는 `apps/api`에서만 사용.
- Mobile/Web은 CINEMO API만 호출.
- Controller는 외부 API client나 Prisma를 직접 호출하지 않음.



### Prisma 스키마 타입 규칙

영화 도메인의 Prisma 스키마는 `apps/api/prisma/schema.prisma`를 기준으로 관리.

```prisma
id        String   @id @default(uuid(7)) @db.Uuid
createdAt DateTime @default(now()) @db.Timestamptz(3)
updatedAt DateTime @updatedAt @db.Timestamptz(3)
```


| 표현                   | 사용 기준                                    |
| -------------------- | ---------------------------------------- |
| `@db.Uuid`           | CINEMO 내부 식별자와 관계 외래 키                   |
| `@default(uuid(7))`  | 생성 시각 기준 정렬 특성을 가진 내부 UUID               |
| `@db.Text`           | 제목·URL·외부 provider 식별자처럼 길이 제한이 불명확한 문자열 |
| `@db.Date`           | 영화 개봉일처럼 날짜만 필요한 값                       |
| `@db.Timestamptz(3)` | 생성·수정·검증·수집 시각                           |
| `@updatedAt`         | Prisma update 시 수정 시각 자동 갱신              |


내부 `Movie.id`와 외부 `externalId`를 분리. 외부 식별자는 `MovieProviderLink`에 `sourceProvider`와 함께 저장.

## 2-1. 과도하게 분리하지 않음

폴더를 많이 만드는 것이 좋은 구조를 의미하지 않음. **기능 단위로 먼저 나누고, 그 기능 안에서만 Controller·Service·Repository·DTO·Types를 분리.**

```text
좋은 구조
modules/movies/
├── movies.controller.ts
├── movies.service.ts
├── movies.repository.ts
├── kobis-movie-import.service.ts
├── movie-matcher.service.ts
├── dto/
├── mappers/
└── types/
```

```text
피해야 할 구조
controllers/
services/
repositories/
dtos/
types/
└── 모든 기능의 파일이 전역 폴더에 섞임
```

규칙:

- 기능이 하나뿐이면 별도 공통 폴더를 만들지 않음.
- 한 기능에서만 사용하는 코드는 반드시 해당 기능 폴더 안에 둠.
- `common`은 실제로 여러 기능이 공유할 때만 사용.
- `lobby`는 홈 화면 데이터 조합만 담당하고 영화 원본 로직을 소유하지 않음.
- 파일 수를 늘리기보다 책임이 섞일 때만 분리.
- 작은 기능은 처음부터 복잡한 계층을 만들지 않고 필요한 시점에 확장.



### 외부 API HttpModule 등록

외부 API 연동 모듈마다 필요한 HTTP 설정을 해당 Integration Module 안에서 관리.


| 등록 방식                      | 사용 기준                                          |
| -------------------------- | ---------------------------------------------- |
| `HttpModule.register`      | timeout처럼 고정 설정만 필요한 경우                        |
| `HttpModule.registerAsync` | `ConfigService`, `registerAs`, 환경변수 설정이 필요한 경우 |
| 전역 등록                      | 모든 기능이 동일한 HTTP 설정을 공유해야 하는 경우에만 검토            |


현재 KOBIS·TMDB·KMDb·YouTube는 API별 `baseURL`, 인증 정보, timeout 정책이 다르므로 전역 등록을 사용하지 않음. 각 Integration Module에서 `registerAsync`로 API별 설정을 주입.

```ts
// apps/api/src/integrations/kobis/kobis.module.ts

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>("kobis.baseUrl"),
        timeout: 10_000,
        maxRedirects: 3,
        params: {
          key: configService.getOrThrow<string>("kobis.apiKey"),
        },
      }),
    }),
  ],
  providers: [KobisService],
  controllers: [KobisController],
  exports: [KobisService],
})
export class KobisModule {}
```

- `baseURL`과 API key는 `registerAs("kobis")` 설정에서 읽음.
- API key는 KOBIS Module의 기본 query parameter로 주입.
- `KobisService`는 endpoint path와 기능별 query parameter만 관리.
- `HttpModule`을 전역 등록하지 않아 다른 외부 API 설정과 섞이지 않게 유지.



## 3. NestJS 기능 모듈 구조

기능별로 모듈을 나누고, 한 기능의 파일은 같은 디렉터리에 둠.

```text
src/modules/movies/
├── movies.module.ts
├── movies.controller.ts
├── movies.service.ts
├── movies.repository.ts
├── dto/
│   ├── requests/
│   │   ├── search-movies.request.dto.ts
│   │   └── get-movie.request.dto.ts
│   └── responses/
│       ├── movie.response.dto.ts
│       ├── movie-list.response.dto.ts
│       ├── movie-credit.response.dto.ts
│       ├── movie-genre.response.dto.ts
│       └── movie-person.response.dto.ts
├── schemas/                         # 해당 기능에서 실제 검증이 필요할 때만 생성
│   └── movie.schema.ts
├── mappers/
│   └── movie-response.mapper.ts
└── types/
    └── movie.types.ts
```



### 계층별 책임


| 계층          | 책임                                      |
| ----------- | --------------------------------------- |
| Controller  | HTTP 입력·출력, DTO 연결, status code         |
| Service     | 업무 규칙, provider 조합, 트랜잭션 흐름             |
| Repository  | Prisma 조회·저장                            |
| Mapper      | DB/domain/provider 결과를 Response DTO로 변환 |
| Integration | KOBIS·TMDB·KMDb·YouTube 통신과 원본 응답 해석    |
| DTO         | 외부 입력 검증과 공개 응답 형태 정의                   |
| Schema      | Zod 기반 런타임 데이터 검증                       |




### Controller 작성 규칙

Controller는 HTTP 경계만 담당.

- `@ApiQuery`는 사용하지 않음.
- Query parameter는 Request DTO로 받음.
- Controller에서 업무 규칙·Prisma·외부 API 호출을 하지 않음.
- Controller에서 `try/catch`로 업무 오류를 처리하지 않음.
- Controller 메서드에 명시적인 `Promise<...>` 반환 타입을 적지 않음.
- Controller에서 `async`가 필요하지 않으면 사용하지 않음.
- Service의 Promise를 그대로 반환.

```ts
@Get('search')
search(@Query() query: SearchMoviesRequestDto) {
  return this.moviesService.search(query);
}
```

`@ApiQuery` 대신 DTO 필드에 validation과 Swagger metadata를 작성.

```ts
export class SearchMoviesRequestDto {
  @ApiProperty({ example: '어벤져스' })
  @IsString()
  @IsNotEmpty()
  query!: string;
}
```



## 4. DTO 규칙



### Request와 Response의 분리

Request와 Response DTO를 한 파일에 같이 넣지 않음.

```text
dto/
├── requests/
│   └── login.request.dto.ts
└── responses/
    └── user.response.dto.ts
```

이유:

- 입력 필드와 출력 필드의 목적이 다름.
- 응답에 `passwordHash`, 내부 ID, 운영용 필드를 실수로 노출하는 문제 방지.
- Request와 Response가 서로 다른 방향으로 변경될 수 있음.
- Swagger 문서와 API 버전 관리가 쉬움.
- 한 파일이 커지는 문제 방지.

원칙:

- DTO 하나당 파일 하나를 사용.
- 파일명은 `행동.request.dto.ts`, `대상.response.dto.ts` 형식을 사용.
- DTO에 Prisma 타입을 직접 extends하지 않음.
- Prisma 결과를 그대로 Controller에서 반환하지 않음.
- Response DTO로 명시적으로 매핑.



### `packages/api-contract`와의 관계

`apps/api`의 Nest DTO는 실제 validation과 Swagger 경계를 담당.

`packages/api-contract`는 Mobile/Web이 사용하는 순수 TypeScript HTTP 계약만 둠.

```text
apps/api/modules/*/dto       # Nest validation·Swagger용
packages/api-contract        # 클라이언트 공유 타입용
```

`api-contract`에는 NestJS, Prisma, Express import를 넣지 않음.

## 5. OpenAPI Codegen 규칙

Web·Mobile이 API 응답 타입을 직접 중복 작성하지 않도록 NestJS Swagger 문서를 기준으로 타입을 생성.

```text
NestJS Controller·Response DTO
        ↓
Swagger OpenAPI JSON
        ↓  /api-json
OpenAPI Codegen
        ↓
packages/api-contract/src/generated/
        ↓
Web·Mobile 타입·API Client
```

NestJS Swagger JSON 주소:

```text
http://localhost:3050/api-json
```

Codegen 도구 선택:


| 패키지                     | 역할                             | 현재 사용 여부        |
| ----------------------- | ------------------------------ | --------------- |
| `@hey-api/openapi-ts`   | OpenAPI에서 TypeScript 타입·SDK 생성 | Codegen 실행 도구   |
| `@hey-api/client-fetch` | 생성된 Fetch API Client의 실행 런타임   | SDK 생성 시 추가     |
| `packages/api-contract` | 생성된 HTTP 계약 타입을 보관             | Web·Mobile에서 사용 |


`@hey-api/client-fetch`는 Codegen 도구의 TypeScript 호환성을 해결하는 패키지가 아님. Fetch 기반 Client를 생성할 때만 추가.

현재 프로젝트의 TypeScript 7과 Codegen 도구의 Compiler API가 완전히 맞지 않을 수 있으므로, 애플리케이션의 TypeScript 버전을 낮추지 않음. Codegen 실행 시에만 호환되는 TypeScript 버전을 임시 사용.

```json
{
  "scripts": {
    "codegen:openapi": "pnpm dlx --package=@hey-api/openapi-ts@0.99.0 --package=typescript@5.9.3 openapi-ts -i http://localhost:3050/api-json -o packages/api-contract/src/generated"
  }
}
```

실행 순서:

```bash
pnpm dev:api
pnpm codegen:openapi
```

규칙:

- `apps/api`의 NestJS DTO와 Swagger decorator를 API 계약의 원본으로 사용.
- `packages/api-contract/src/generated/`의 파일은 직접 수정하지 않음.
- 생성 결과가 변경되면 Codegen을 다시 실행.
- 수동으로 만든 동일한 Response 타입과 생성 타입을 동시에 관리하지 않음.
- 생성 타입을 도입한 뒤 동일한 수동 타입은 제거하고 `packages/api-contract/src/index.ts`에서 생성 타입을 export.



### 패키지 별칭 규칙

Web·Mobile에서는 파일 경로를 직접 참조하지 않고 workspace package 이름을 별칭처럼 사용.


| 별칭                     | 대상                      | 사용 목적                               |
| ---------------------- | ----------------------- | ----------------------------------- |
| `@cinemo/api-contract` | `packages/api-contract` | API 요청·응답 타입과 생성된 API Client        |
| `@cinemo/shared`       | `packages/shared`       | Web·Mobile·API가 함께 사용하는 순수 타입·상수·유틸 |


`@cinemo/api-contract`와 `@cinemo/shared`는 `tsconfig.json`의 `paths`로 만든 별칭이 아님. 각 패키지의 `package.json` `name`과 pnpm workspace 의존성을 통해 연결되는 패키지 이름임.

```json
// apps/web/package.json 또는 apps/mobile/package.json
{
  "dependencies": {
    "@cinemo/api-contract": "workspace:*",
    "@cinemo/shared": "workspace:*"
  }
}
```

현재 Web은 두 패키지를 사용하도록 등록되어 있음. Mobile에서 `@cinemo/api-contract`를 사용하기 전에는 동일한 workspace 의존성을 Mobile에도 추가.

Mobile에 API 계약 패키지를 추가할 때는 zsh가 `*`를 파일 패턴으로 해석하지 않도록 전체 패키지 표현을 따옴표로 감쌈.

```bash
pnpm --filter @cinemo/web add '@cinemo/api-contract@workspace:*'
pnpm --filter @cinemo/mobile add '@cinemo/api-contract@workspace:*'
```

현재 Web에는 이미 `@cinemo/api-contract`가 등록되어 있으므로 Web에서 명령을 다시 실행할 필요는 없음. 새로 연결하거나 누락된 경우에만 해당 명령을 실행.

### Web에서 사용하는 방식

Web은 생성된 타입을 `@cinemo/api-contract`에서 type-only import.

```ts
import type { MovieSearchResponse } from "@cinemo/api-contract";

export async function searchMovies(query: string): Promise<MovieSearchResponse> {
  const response = await fetch(
    `/v1/movies/search?query=${encodeURIComponent(query)}&page=1&limit=10`,
  );

  return response.json() as Promise<MovieSearchResponse>;
}
```

`MovieSearchResponse`는 실행 시 존재하는 객체가 아니라 TypeScript 컴파일 시점의 계약 타입임. 실제 요청·응답 검증이 필요하면 별도의 런타임 스키마를 추가.

### Mobile에서 사용하는 방식

Mobile도 같은 API 계약 타입을 사용하며, 플랫폼에 맞는 HTTP 호출 방식만 별도로 구현.

```ts
import type { MovieSearchResponse } from "@cinemo/api-contract";

export async function searchMovies(query: string): Promise<MovieSearchResponse> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/v1/movies/search?query=${encodeURIComponent(query)}&page=1&limit=10`,
  );

  return response.json() as Promise<MovieSearchResponse>;
}
```

Web과 Mobile이 같은 `MovieSearchResponse`를 사용하므로 API 응답 필드가 변경되면 두 클라이언트의 타입 오류를 통해 영향을 확인할 수 있음. 화면 컴포넌트와 네트워크 설정은 플랫폼별로 분리하고, HTTP 계약 타입만 공유.

### `packages/shared` 빌드 규칙

현재 `packages/shared`는 별도의 `dist` 결과물을 만들지 않고 `src`를 직접 참조.

```json
// packages/shared/package.json
{
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

따라서 Web·Mobile·API가 로컬 workspace의 `packages/shared/src`를 사용하는 동안에는 `build:shared`를 따로 실행하지 않음. 수정 후 타입만 확인.

```bash
pnpm --filter @cinemo/shared typecheck
```

`build:shared`는 다음과 같이 `dist`를 배포하거나 빌드 결과물만 사용하는 구조로 바뀔 때 추가.

- Docker·CI에서 TypeScript 소스가 아닌 빌드 결과물을 실행할 때
- 패키지를 외부에 배포할 때
- `main`과 `types`가 `dist`를 가리키도록 변경할 때



## 6. Web·Mobile 화면 구현 규칙



### 검색·필터·폼 상태 관리

검색 조건이 여러 개인 기능은 다음 세 가지를 기본 조합으로 사용.


| 도구                      | 책임                             |
| ----------------------- | ------------------------------ |
| `react-hook-form`       | 검색 조건·폼 입력값·제출 상태 관리           |
| `zod`                   | 입력값의 런타임 검증과 타입 추론             |
| `@tanstack/react-query` | 제출된 조건으로 API 요청·캐싱·로딩·에러 상태 관리 |


```text
입력값
  ↓
React Hook Form
  ↓
Zod 검증
  ↓
제출된 검색 조건
  ↓
TanStack Query
  ↓
api-contract 타입의 API 응답
```

검색 조건을 여러 개 받는 화면에서 입력값을 각각 `useState`로 관리하거나 `fetch`를 직접 호출하지 않음. `useState`는 모달 열림 상태·선택된 탭처럼 서버 요청과 관계없는 화면 상태에만 사용.

```ts
const form = useForm<MovieSearchForm>({
  resolver: zodResolver(movieSearchSchema),
});

const movieQuery = useQuery({
  queryKey: ["movies", "search", submittedFilters],
  queryFn: () => searchMovies(submittedFilters),
  enabled: submittedFilters !== null,
});
```

입력 중인 값과 실제 API 요청에 사용한 값을 분리. 검색어를 입력하는 매 순간 요청하지 않고, 폼 제출이 완료된 조건만 Query Key에 사용.

### 아이콘 사용 규칙

화면에 유니코드 문자나 텍스트로 아이콘을 표현하지 않음.

```tsx
// 사용하지 않음
<Text>← 뒤로가기</Text>
<Text>×</Text>
```

플랫폼별 아이콘 패키지를 사용.


| 플랫폼    | 패키지                  | 예시                           |
| ------ | -------------------- | ---------------------------- |
| Web    | `lucide-react`       | `ArrowLeft`, `Search`, `X`   |
| Mobile | `@expo/vector-icons` | `Ionicons name="arrow-back"` |


```tsx
// Mobile
<Ionicons name="arrow-back" size={24} color="#f3efe6" />
```

아이콘 컴포넌트는 Web·Mobile의 렌더링 방식이 다르므로 `packages/shared`에 넣지 않음. `shared`에는 필요한 경우 아이콘 의미 이름·크기·색상 토큰만 둠.

## 7. `interface`와 `type` 사용 기준

둘 다 TypeScript의 구조적 타입 시스템을 사용하지만, 프로젝트에서는 역할을 기준으로 구분함.


| 상황                       | 사용          | 예시                            |
| ------------------------ | ----------- | ----------------------------- |
| 객체 형태·도메인 모델             | `interface` | `MovieTitle`, `MovieMedia`    |
| 문자열·숫자 리터럴 유니온           | `type`      | `TitleType`, `MediaType`      |
| primitive 별칭·tuple·union | `type`      | `MovieId`, `ApiResult`        |
| mapped·conditional type  | `type`      | `PartialMovie`, `Nullable<T>` |


```ts
type TitleType = "PRIMARY" | "ORIGINAL" | "ALIAS" | "RERELEASE";

interface MovieTitle {
  movieId: string; // 제목이 연결된 내부 영화 ID
  title: string; // 저장할 영화 제목
  languageCode: string; // 제목 언어 코드. ko, en, ja, it 등
  titleType: TitleType; // 제목의 용도와 출처 구분
}
```

- 객체 계약은 `interface`를 우선 사용.
- 유니온·리터럴·타입 조합은 `type`을 사용.
- 문자열 union·enum 형태의 값은 코드 블록만 작성하지 않고 각 값의 의미를 표로 함께 기록.
- 같은 이름의 `interface`를 여러 파일에서 선언해 자동 병합하지 않음.
- DTO는 `class`, Prisma 모델은 Prisma schema에서 정의.



### `satisfies` 사용 기준

`satisfies`는 객체가 특정 타입의 구조를 따르는지 컴파일 시점에 검사하면서, 객체의 구체적인 타입 추론은 유지하는 TypeScript 문법.

```ts
const movieInclude = {
  titles: true,
  releases: true,
  media: true,
  providerLinks: true,
  watchOptions: true,
} satisfies Prisma.MovieInclude;
```


| 표현                              | 의미                                       |
| ------------------------------- | ---------------------------------------- |
| `: Prisma.MovieInclude`         | 변수 타입을 `Prisma.MovieInclude`로 지정         |
| `satisfies Prisma.MovieInclude` | 해당 타입과 구조가 맞는지 검사하면서 실제 객체의 구체적인 키 정보 유지 |
| `as Prisma.MovieInclude`        | 타입을 강제로 변환. 잘못된 구조를 숨길 수 있어 사용하지 않음      |


Prisma의 `Prisma.GetPayload`와 함께 사용할 때 `satisfies`를 사용. `movieInclude`에 잘못된 relation 이름이 들어가면 컴파일 오류를 표시하고, `typeof movieInclude`로 정확한 조회 결과 타입을 추론.

### DTO·Schema·Types 구분

세 가지를 같은 용도로 사용하지 않음.


| 구분     | 목적                     | 검증 시점           | 위치                                    |
| ------ | ---------------------- | --------------- | ------------------------------------- |
| DTO    | HTTP 요청·응답과 Swagger 문서 | NestJS 요청 처리 시점 | `modules/*/dto`                       |
| Schema | 실제 값의 런타임 구조 검증        | 외부 응답·계약 경계     | `schemas` 또는 `integrations/*/schemas` |
| Type   | TypeScript 컴파일 타임 타입   | 컴파일 시점          | `types` 또는 `packages/shared`          |


현재 기준:

- NestJS Controller 입력은 Request DTO를 사용.
- 외부 API 원본 응답은 Zod Schema로 검증.
- Provider Schema는 각 `integrations/*/schemas` 안에 둠.
- 여러 앱이 공유하는 Zod Schema는 `packages/api-contract` 안에 둠.
- 특정 기능에서만 사용하는 Schema는 해당 `modules/*/schemas` 안에 둠.
- 같은 규칙을 class-validator와 Zod에 중복해서 작성하지 않음.
- Prisma `schema.prisma`는 Zod Schema와 다르므로 `apps/api/prisma`에만 둠.

```text
integrations/kmdb/
├── dto/                             # KMDb 원본 응답 타입
├── schemas/                         # KMDb 원본 응답 Zod 검증
├── kmdb.client.ts
└── kmdb.adapter.ts
```

`schemas/`는 실제 Schema 파일이 필요할 때만 생성. 비어 있는 폴더를 미리 만들지 않음.

## 8. Controller·Service·Repository·Types 분리

```text
Request DTO
    ↓
Controller
    ↓
Service / Use Case
    ↓
Repository 또는 Integration
    ↓
Mapper
    ↓
Response DTO
```



### Controller

- URL, HTTP method, 인증 decorator, Request DTO, Response DTO만 관리.
- 입력을 받아 Service에 전달하고 결과를 반환.
- `@ApiQuery` 대신 Query Request DTO를 사용.
- DB 모델이나 외부 API 원본 응답을 반환하지 않음.



### Swagger 문서화

Swagger를 실제 API 사용 설명서로 사용. Controller와 DTO에 문서화 decorator를 함께 작성.

필수 규칙:

- Controller마다 `@ApiTags` 작성.
- 모든 endpoint마다 `@ApiOperation({ summary })` 작성.
- 성공 응답마다 `@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiNoContentResponse` 중 하나 작성.
- Request DTO 필드마다 `@ApiProperty` 또는 `@ApiPropertyOptional` 작성.
- 숫자 Query 필드는 TypeScript 타입(`page: number`)과 Swagger 타입(`type: Number`)을 함께 명시. 타입이 빠지면 Swagger에서 `object`로 표시될 수 있음.
- Response DTO 필드도 Swagger에 표시할 값만 decorator로 명시.
- 인증이 필요한 endpoint에는 `@ApiBearerAuth` 적용.
- `@ApiQuery`는 사용하지 않고 Query Request DTO를 `@Query()`로 받음.

```ts
@ApiTags("영화")
@Controller("movies")
export class MoviesController {
  @Get("search")
  @ApiOperation({ summary: "영화 검색" })
  @ApiOkResponse({ type: MovieListResponseDto })
  search(@Query() query: SearchMoviesRequestDto) {
    return this.moviesService.search(query);
  }
}
```

```ts
export class SearchMoviesRequestDto {
  @ApiProperty({ description: "검색할 영화 제목" })
  query: string;

  @ApiPropertyOptional({ description: "페이지 번호", default: 1 })
  page?: number;
}
```


| decorator              | 의미                          |
| ---------------------- | --------------------------- |
| `@ApiTags`             | Swagger에서 Controller를 묶는 분류 |
| `@ApiOperation`        | endpoint가 하는 일을 설명하는 요약     |
| `@ApiOkResponse`       | 성공 응답 DTO 설명                |
| `@ApiCreatedResponse`  | 생성 성공 응답 DTO 설명             |
| `@ApiProperty`         | 필수 Request·Response 필드 설명   |
| `@ApiPropertyOptional` | 선택 Request·Response 필드 설명   |
| `@ApiBearerAuth`       | Bearer Token 인증 필요 표시       |


`summary`는 짧고 사용자가 바로 이해할 수 있는 한국어 문장으로 작성. Swagger에서 endpoint만 보고도 요청 목적·인증 필요 여부·응답 형태를 확인할 수 있어야 함.

### Service

- 실제 업무 흐름과 조건 분기를 관리.
- Repository와 Integration을 조합.
- timeout, fallback, 매칭 정책, 백필 정책을 적용.
- 외부 API 실패를 도메인 규칙에 맞게 처리.
- 반환 타입은 명시적인 도메인 타입 또는 Response DTO를 사용.

검색 API는 목록 항목과 전체 페이지 응답을 분리.

```text
MovieSearchItemResponseDto
  └─ 영화 한 편의 목록 정보

MovieSearchResponseDto
  ├─ items: MovieSearchItemResponseDto[]
  ├─ totalCount
  ├─ page
  └─ limit
```

- `MovieSearchItemResponseDto`: 제목·대표 개봉일·대표 포스터·장르 등 목록 표시 정보
- `MovieSearchResponseDto`: 검색 목록과 페이지네이션 정보 전체 응답
- 필터 조건은 Request DTO에 추가
- 필터 선택지·집계 정보가 필요해지면 전체 Response DTO에 추가

검색 Request DTO 규칙:

```ts
export class SearchMoviesRequestDto {
  @ApiProperty({ example: "어벤져스" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query!: string;

  @ApiProperty({ type: Number, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ type: Number, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
```

- Query String은 처음에 문자열로 들어오므로 `@Type(() => Number)`로 숫자 변환.
- `page`는 1 이상.
- `limit`은 1 이상 100 이하.
- 숫자 Query 필드는 `@ApiProperty({ type: Number })`를 함께 작성해 Swagger가 `object`로 인식하지 않게 함.

```ts
async search(
  query: SearchMoviesRequestDto,
): Promise<MovieListResponseDto> {
  // 업무 규칙과 Repository·Integration 조합
}
```



### Repository

- Prisma Client를 사용한 DB 조회·저장만 담당.
- HTTP DTO를 알지 않음.
- 외부 API를 호출하지 않음.
- Prisma 결과를 Service가 사용할 내부 타입으로 반환.
- `include`는 기본 모델 컬럼에 관계 데이터를 별도 속성으로 추가.
- 관계 데이터는 컬럼으로 평탄화하지 않고 relation 필드 이름으로 반환.
- 검색 Repository는 영화 목록과 `totalCount`를 함께 반환.
- 상세 조회용 `movieInclude`와 검색용 `movieSearchInclude`를 분리.
- 검색용 include에는 목록에 필요한 제목·개봉일·포스터·장르만 포함.
- 제목·장르·감독·배우 조건은 `OR`로 연결.
- 현재 페이지는 `skip = (page - 1) * limit`, `take = limit`으로 조회.
- `updatedAt desc` 기준으로 최근 갱신 영화부터 정렬.

```ts
// $transaction 콜백 결과는 일반 Promise로 반환
search(...): Promise<{
  movies: MovieSearchWithDetails[];
  totalCount: number;
}>;
```

검색 결과와 전체 개수는 별도 조회.

```text
movie.findMany → 현재 페이지 movies
movie.count    → 전체 totalCount
```

두 값을 하나의 결과로 묶기 위해 `$transaction(async (tx) => {})` 안에서 조회. 콜백 형태의 `$transaction`은 일반 `Promise`를 반환하므로 Repository 반환 타입도 `Prisma.PrismaPromise`가 아닌 `Promise`로 작성.

#### Prisma `include` 응답 구조

```ts
const movieInclude = {
  titles: true,
  releases: true,
  media: true,
} satisfies Prisma.MovieInclude;
```

응답은 `Movie` 기본 컬럼과 관계 속성이 함께 있는 중첩 구조.

```ts
{
  id: string; // Movie 기본 컬럼
  createdAt: Date; // 생성 시각
  updatedAt: Date; // 수정 시각
  titles: MovieTitle[]; // MovieTitle 관계
  releases: MovieRelease[]; // MovieRelease 관계
  media: MovieMedia[]; // MovieMedia 관계
}
```

`include`가 관계 테이블의 컬럼을 `Movie`에 합치는 것은 아님. `titles`, `releases`, `media`처럼 Prisma schema에 선언한 relation 필드로 추가.

```text
Movie
├── 기본 컬럼
├── titles[]
├── releases[]
├── media[]
└── movieCredits[].person
```


| 관계 형태   | 결과 형태             |
| ------- | ----------------- |
| 일대다     | 배열 `[]`           |
| 일대일·다대일 | 객체 또는 `null`      |
| 중첩 관계   | 하위 관계 속성 안에 다시 포함 |


상세 조회와 검색 조회의 `include`를 같은 방식으로 만들지 않음.


| 조회    | 포함 관계                             |
| ----- | --------------------------------- |
| 상세 조회 | 제목·개봉·미디어·provider·시청 정보·장르·인물 전체 |
| 검색 조회 | 목록에 필요한 제목·대표 개봉일·대표 포스터·장르       |


Prisma `include` 결과는 API 응답이 아님. Mapper에서 날짜·Decimal·대표 데이터 선택 규칙을 적용한 뒤 Response DTO로 변환.

### Mapper

- Prisma 조회 결과를 Response DTO 형태로 변환.
- `Date`를 `YYYY-MM-DD` 또는 ISO 문자열로 변환.
- 대표 제목·대표 개봉일·대표 포스터 선택 규칙을 적용.
- Service에 반복되는 필드 변환 코드를 넣지 않음.



#### Service에서 `.map(toDto)`를 사용하는 이유

`map`은 배열의 각 항목을 변환하고, 변환된 값으로 새로운 배열을 반환.

```ts
const movies = await repository.findMany();

const items = movies.map(toMovieSearchItemResponseDto);
```

위 코드는 다음 코드와 같은 의미.

```ts
const items = movies.map((movie) => {
  return toMovieSearchItemResponseDto(movie);
});
```

변환 전·후 구조:

```text
Prisma Movie[]
  ├─ Movie
  ├─ Movie
  └─ Movie
       ↓ map(toMovieSearchItemResponseDto)
Response DTO[]
  ├─ MovieSearchItemResponseDto
  ├─ MovieSearchItemResponseDto
  └─ MovieSearchItemResponseDto
```

검색 Service의 최종 반환 예시:

```ts
const { movies, totalCount } = await repository.search(
  query,
  page,
  limit,
);

return {
  // Movie 하나씩 검색 목록 DTO로 변환
  items: movies.map(toMovieSearchItemResponseDto),
  // 페이지 제한 전 전체 결과 수
  totalCount,
  // 현재 페이지 정보
  page,
  limit,
};
```

실제 영화 데이터 예시:

```text
Prisma 조회 결과
MovieA = {
  id: "01a0f063-d740-7084-a1ea-ed5c020640bb",
  titles: [{ title: "어벤져스: 엔드게임 앙코르", titleType: "PRIMARY" }],
  releases: [{ releaseDate: "2026-09-23", isPrimary: true }],
  media: [{ mediaType: "POSTER", url: "https://image.tmdb.org/poster.jpg", isPrimary: true }],
  movieGenres: [{ name: "액션" }, { name: "SF" }],
}

MovieB = {
  id: "01a0f063-d760-727f-b7e9-84c32a9b914a",
  titles: [{ title: "어벤져스: 인피니티 워", titleType: "PRIMARY" }],
  releases: [{ releaseDate: "2018-04-25", isPrimary: true }],
  media: [{ mediaType: "POSTER", url: "https://image.tmdb.org/poster2.jpg", isPrimary: true }],
  movieGenres: [{ name: "액션" }, { name: "모험" }],
}

map(toMovieSearchItemResponseDto) 이후
MovieA → {
  id: "01a0f063-d740-7084-a1ea-ed5c020640bb",
  title: "어벤져스: 엔드게임 앙코르",
  releaseDate: "2026-09-23",
  posterUrl: "https://image.tmdb.org/poster.jpg",
  genres: ["액션", "SF"],
}

MovieB → {
  id: "01a0f063-d760-727f-b7e9-84c32a9b914a",
  title: "어벤져스: 인피니티 워",
  releaseDate: "2018-04-25",
  posterUrl: "https://image.tmdb.org/poster2.jpg",
  genres: ["액션", "모험"],
}
```

`map`은 새로운 배열을 반환하지만 원본 `movies`를 수정하지 않음. `forEach`는 반복 실행만 하고 배열을 반환하지 않으므로 Response DTO 배열 생성에 사용하지 않음.

### Types

`types/`는 DTO나 Prisma 모델을 대체하는 폴더가 아님.

- 도메인 내부에서 사용하는 순수 타입
- provider와 무관한 내부 상태 타입
- 매칭 결과·백필 상태·미디어 후보 타입
- 함수 인자와 반환값의 조합 타입

```text
modules/movies/types/
├── movie.types.ts
├── movie-match.types.ts
└── movie-media.types.ts
```

구분 규칙:


| 종류              | 위치                        | 역할                    |
| --------------- | ------------------------- | --------------------- |
| Request DTO     | `modules/*/dto/requests`  | HTTP 입력 검증            |
| Response DTO    | `modules/*/dto/responses` | HTTP 응답 공개 형태         |
| Domain Type     | `modules/*/types`         | 내부 업무 타입              |
| Provider Type   | `integrations/*/types`    | 외부 API 원본 형태          |
| Prisma Type     | Prisma Client             | DB 레코드 형태             |
| Shared Contract | `packages/api-contract`   | Mobile/Web 공유 HTTP 타입 |




## 9. 외부 API Integration 규칙

```text
integrations/tmdb/
├── tmdb.client.ts             # HTTP 요청·timeout·공통 오류
├── tmdb.adapter.ts            # 원본 응답 → 내부 타입
├── dto/
│   ├── tmdb-search.response.ts
│   └── tmdb-detail.response.ts
└── types/
    └── tmdb.types.ts
```

- Provider 응답 DTO와 CINEMO Response DTO를 분리.
- KMDb의 `Data`, `Result`, `director`, `actor`, `plot`, `vod` 구조가 Service까지 새어 나오지 않게 관리.
- `Content-Type` 확인과 응답 schema 검증을 적용.
- 외부 요청에는 timeout을 적용.
- 외부 API 결과를 화면 요청 중에 연쇄 호출하지 않음.
- 수집·백필 결과를 DB에 저장하고 Mobile/Web은 CINEMO API만 조회.



## 10. 영화 데이터의 기준

- `Movie.id`를 CINEMO 내부 기준 식별자로 먼저 생성.
- KOBIS·TMDB·KMDb·YouTube·IMDb ID는 `MovieProviderLink`로 나중에 연결.
- 제목만 같다는 이유로 자동 연결하지 않음.
- 검색 결과의 첫 번째 항목을 무조건 사용하지 않음.
- 확실하지 않은 매칭은 `unmatched` 또는 수동 검토 상태로 둠.
- 재개봉은 `Movie`를 덮어쓰지 않고 `MovieRelease`로 분리.
- 포스터·배경·예고편은 `MovieMedia`로 provider와 함께 저장.
- KOBIS·KMDb 미디어는 확인된 `MovieRelease.id`에 연결하고, TMDB 미디어는 최초 개봉일만 제공하므로 `releaseId = null`로 저장.
- 감독·배우는 `MoviePerson`에 저장하고, 영화와 인물의 역할은 `MovieCredit`으로 연결.
- KMDb `actorId`·`directorId`와 같은 외부 인물 ID는 `MoviePersonProviderLink`에 저장.
- 인물 이름 표기가 다르면 이름만으로 자동 병합하지 않고 외부 ID 또는 관리자 검토로 확인.



## 11. Prisma 규칙

- Prisma schema와 migration은 `apps/api/prisma`에 둠.
- `PrismaService`는 `apps/api/src/prisma`에서 전역 모듈로 제공.
- Repository 외부에서 Prisma Client를 직접 호출하지 않음.
- DB 모델을 API 응답으로 직접 반환하지 않음.
- `MoviePersonProviderLink`는 `[sourceProvider, externalId]`를 유일하게 유지해 외부 인물 중복 연결을 방지.
- migration 파일은 수정하지 않고 새 migration으로 변경.
- 개발용 DB와 운영용 DB의 migration 이력을 분리하지 않음.
- `prisma/seed.ts`는 개발·테스트용 고정 샘플만 저장.
- 실제 영화 데이터는 provider 수집·정규화·백필 흐름으로 저장.
- Prisma 7 seed는 `prisma db seed`를 명시적으로 실행.
- Prisma 결과는 Mapper에서 Response DTO로 변환한 뒤 Controller에서 반환.



## 12. 공통 코드 규칙

- 전역에서 재사용되는 guard·filter·pipe·decorator만 `common`에 둠.
- 특정 기능에서만 쓰는 코드는 해당 module 내부에 둠.
- 공통 타입·상수·순수 함수는 `packages/shared`에 둠.
- 외부 서비스별 환경변수는 해당 integration 이름을 접두사로 사용.
- 비밀값과 `.env`는 커밋하지 않음.



### `constants/` 사용 기준

처음부터 전역 `constants/` 폴더를 크게 만들지 않음. 여러 파일에서 실제로 반복되는 실행 중 고정값이 생겼을 때 범위를 기준으로 배치.

```text
packages/shared/constants/                 # Web·Mobile·API가 함께 사용
apps/api/src/common/constants/             # API 전체에서 사용
apps/api/src/modules/movies/constants/     # movies 기능에서만 사용
apps/api/src/integrations/kobis/constants/ # KOBIS 연동에서만 사용
```

```ts
export const MOVIE_PROVIDERS = [
  "KOBIS",
  "TMDB",
  "KMDB",
  "YOUTUBE",
] as const;
```


| 대상                           | 위치                               |
| ---------------------------- | -------------------------------- |
| Web·Mobile·API가 함께 사용하는 실행 값 | `packages/shared/constants/`     |
| API 전체에서 사용하는 실행 값           | `apps/api/src/common/constants/` |
| 특정 기능에서만 사용하는 실행 값           | 해당 `modules/*/constants/`        |
| 외부 연동에서만 사용하는 실행 값           | 해당 `integrations/*/constants/`   |
| 문자열 Union 타입                 | `types/` 또는 `packages/shared`    |
| PostgreSQL Enum              | `apps/api/prisma/schema.prisma`  |
| 환경변수 이름                      | `config/env-keys.ts`             |


`constants/`에는 실행 중 사용하는 고정값만 저장. 타입 정의는 `types/`, 데이터베이스 Enum은 Prisma schema, 환경변수 이름은 `EnvKeys`에서 관리.

### 환경변수 키 규칙

NestJS 코드에서 환경변수 이름을 문자열로 직접 작성하지 않음. `EnvKeys` 상수 객체에서 관리.

```ts
export const EnvKeys = {
  DATABASE_URL: "DATABASE_URL",
  API_PORT: "API_PORT",
} as const;
```

```ts
configService.getOrThrow<string>(EnvKeys.DATABASE_URL);
```

- `enum` 대신 `export const EnvKeys` 사용.
- `as const`로 환경변수 키 값을 리터럴 타입으로 고정.
- ConfigModule 검증 schema와 ConfigService 조회에서 같은 `EnvKeys` 사용.
- `.env` 파일에는 실제 환경변수 이름과 값을 기록.
- API 서버 포트는 `API_PORT`로 관리해 Web·Mobile·Database 포트와 구분.
- `prisma.config.ts`는 Prisma CLI가 직접 읽으므로 `env("DATABASE_URL")` 사용.

환경변수 설정은 `registerAs`로 기능별 분리.

```text
config/
├── env-keys.ts              # 환경변수 이름 상수
├── env.validation.ts        # Joi 기반 시작 시 검증
├── app.config.ts            # API_PORT 등 앱 설정
├── database.config.ts       # DATABASE_URL 등 데이터베이스 설정
├── kobis.config.ts          # KOBIS 설정
├── tmdb.config.ts           # TMDB 설정
├── kmdb.config.ts           # KMDb 설정
└── kakao.config.ts          # Kakao 설정
```

외부 API 설정은 `external-api.config.ts`에 합치지 않고 Provider별 파일로 분리. 각 설정 파일은 하나의 `registerAs` namespace만 관리.

```ts
// config/kobis.config.ts
export const kobisConfig = registerAs("kobis", () => ({
  baseUrl: process.env[EnvKeys.KOBIS_BASE_URL],
  apiKey: process.env[EnvKeys.KOBIS_API_KEY],
}));
```

- 현재 사용하는 Provider만 `ConfigModule`의 `load` 배열에 등록.
- 새 Provider를 추가할 때 해당 Provider의 `*.config.ts`와 `EnvKeys`, validation 규칙을 함께 추가.
- Service는 `process.env`를 직접 읽지 않고 `ConfigService`의 namespace 설정만 사용.



### TypeScript 경로 별칭

`apps/api/tsconfig.json`에서 `@/*`를 `src/*`에 연결. API 내부 import는 깊은 상대 경로 대신 `@/` 별칭 사용.

```ts
import { EnvKeys } from "@/config/env-keys";
import { KobisService } from "@/integrations/kobis/kobis.service";
```

- `@/config/*`는 설정 파일
- `@/common/*`는 공통 기능
- `@/integrations/*`는 외부 API 연동
- `@/modules/*`는 도메인 기능
- TypeScript 7에서 제거된 `baseUrl`은 사용하지 않음.
- `paths`의 상대 경로를 `./src/*` 형태로 작성.

```ts
// config/app.config.ts
import { registerAs } from "@nestjs/config";

import { EnvKeys } from "./env-keys";

export const appConfig = registerAs("app", () => ({
  port: Number(process.env[EnvKeys.API_PORT] ?? 3050),
}));
```

```ts
// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  load: [appConfig],
  validationSchema: envValidationSchema,
  validationOptions: {
    convert: true,
    abortEarly: false,
    allowUnknown: true,
  },
});
```

`registerAs`는 설정 접근 구조화용. `env.validation.ts`는 시작 시 환경변수 검증용. 역할이 다르므로 둘 다 유지.

```ts
configService.getOrThrow<number>("app.port");
```



### 명명 규칙

코드에 사용하는 이름은 모두 영어로 작성하고, 이름만 봐도 역할과 동작을 알 수 있게 작성. 한국어는 문서·주석·사용자에게 보여주는 문구에만 사용.


| 대상         | 규칙                     | 예시                                        |
| ---------- | ---------------------- | ----------------------------------------- |
| 폴더·파일      | `kebab-case`           | `movie-search`, `movie-response.dto.ts`   |
| 함수·변수      | `camelCase`            | `searchMovies`, `movieId`                 |
| 클래스·DTO·타입 | `PascalCase`           | `MoviesService`, `SearchMoviesRequestDto` |
| 상수         | `SCREAMING_SNAKE_CASE` | `CINEMO_COLORS`                           |
| DB 테이블·컬럼  | `snake_case`           | `movie_releases`, `created_at`            |
| enum 값     | 의미가 분명한 대문자            | `RERELEASE`, `STREAM`                     |


함수 이름은 동작을 나타내는 동사로 시작.

```ts
searchMovies()
getMovieById()
createMovieRelease()
updateMovieMedia()
deleteMovieQuote()
```

Boolean 변수와 함수는 상태나 가능 여부가 드러나게 작성.

```ts
isAvailable
hasPoster
canSearch
shouldBackfill()
```

다음처럼 의미가 넓은 이름은 사용하지 않음.

```ts
// 나쁜 예
getData()
handleThing()
processInfo()
result

// 좋은 예
getMovieDetail()
backfillMoviePoster()
mapKmdbMovieResponse()
movieSearchResult
```

- `data`, `info`, `item`, `thing`, `result`처럼 의미가 넓은 이름은 실제 대상이 드러나지 않을 때 사용하지 않음.
- 함수 하나는 하나의 동작만 수행하고, 함수 이름에 여러 동작을 나열하지 않음.
- 외부 API의 원본 필드명은 integration 경계 안에서만 사용하고, 내부 도메인 이름은 CINEMO 규칙으로 변환.
- 사용자에게 보이는 한국어 문구와 코드 식별자를 섞지 않음.



### 폰트 번들 규칙

Web과 Mobile은 폰트를 번들하는 방식이 다르므로 실제 폰트 파일을 `shared`에 넣지 않음.

공통 폰트는 [Pretendard 공식 Releases](https://github.com/orioncactus/pretendard/releases/latest)에서 다운로드.

```text
packages/shared/src/theme/typography.ts  # 폰트 이름·크기·굵기 토큰

apps/mobile/assets/fonts/                # .ttf
apps/web/app/fonts/                      # .woff2
```


| 플랫폼    | 폰트 파일    | 로딩 방식             |
| ------ | -------- | ----------------- |
| Mobile | `.ttf`   | `expo-font`       |
| Web    | `.woff2` | `next/font/local` |


- 공통 폰트 이름·굵기·크기 토큰은 `packages/shared`에 둠.
- 실제 폰트 파일은 각 앱의 assets 또는 app/fonts에 둠.
- Mobile의 `expo-font` 설정을 Web에서 재사용하지 않음.
- Web의 `next/font/local` 설정을 Mobile에서 재사용하지 않음.
- `@fontsource`와 로컬 폰트를 같은 용도로 중복 사용하지 않음.



## 13. 구현 순서

제품 우선순위는 [제품 방향](./제품_방향.md)에 따름.

1. Prisma 영화 핵심 모델과 식별 규칙 확정
2. KOBIS 기준 영화·순위·개봉 정보 저장
3. `MovieRelease`로 최초 개봉·재개봉 분리
4. TMDB·KMDb adapter로 포스터·상세 정보 보강
5. `MovieProviderLink` 매칭 및 `unmatched` 처리
6. `MovieMedia` fallback과 포스터 placeholder 구현
7. 영화 검색·상세 API 구현
8. 시청 가능 플랫폼 정보 연동
9. 명대사와 AI 줄거리·번역 보완 추가
10. Mobile/Web에서 영화 조회 흐름 연결
11. User 기반 엽서·소셜 기능 추가
