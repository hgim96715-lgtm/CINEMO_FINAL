# CINEMO

> CINEMO | 영화 속으로, 추억의 한 장면으로
>
> 좋아하는 영화와 함께 새로운 추억을 쌓아가는 공간

**CINEMO** = Cinema + Motion.  
Cinema in Motion — 영화가 움직이고, 사람들이 움직이고, 이야기가 움직이는 영화관 로비.

Cinema는 그리스어 *kínēma*(κίνημα, 움직임)에서 온 말.  
Movie가 “한 편의 영상”에 가깝다면, Cinema는 영화라는 매체·공간·문화 쪽 뉘앙스.  
로비에서 영화를 발견하고, 보고 싶은 영화와 관람 기록을 쌓고, 포스트카드로 이야기를 남기는 흐름이라서 이 이름을 채택했습니다.

## 아이콘 의미

CINEMO 아이콘은 둥근 `C` 안쪽으로 한 아이가 걸어 들어가는 모습을 표현했습니다.

아이는 어릴 때부터 영화를 보고 자라며, 영화와 함께 자신의 인생을 살아가는 존재를 의미합니다. 아이가 영화 안으로 걸어가는 장면은 단순히 영화를 관람하는 모습이 아니라, 영화라는 세계를 지나며 자신의 삶을 만들어가는 과정을 상징합니다.

둥근 `C`는 Cinema의 첫 글자이면서 영화로 들어가는 하나의 공간과 통로를 나타냅니다. 아이가 그 안으로 걸어가는 모습에는 영화가 한 편의 영상으로 끝나는 것이 아니라, 성장과 기억, 인생의 순간에 함께 움직인다는 의미를 담았습니다.

## CINEMO 색상

CINEMO의 기본 색상은 어두운 블루 그린 배경에 골드 포인트를 조합한 구성.


| 토큰                   | 색상                      | 용도                    |
| -------------------- | ----------------------- | --------------------- |
| `cinemo-bg`          | `#0B181B`               | 홈·상세 페이지 기본 배경        |
| `cinemo-bg-deep`     | `#081113`               | 헤더 스크롤 상태·어두운 오버레이    |
| `cinemo-surface`     | `rgb(255 255 255 / 5%)` | 카드·콘텐츠 영역의 반투명 글래스 배경 |
| `cinemo-teal`        | `#176B68`               | 블루 그린 포인트·버튼 배경       |
| `cinemo-teal-deep`   | `#0F514F`               | 버튼 active 상태          |
| `cinemo-teal-light`  | `#9AD8D1`               | 아이콘·보조 강조 색상          |
| `cinemo-gold`        | `#C6A15B`               | 대표 포인트·제목·테두리·링크      |
| `cinemo-gold-light`  | `#D4B56A`               | hover 상태·밝은 골드 강조     |
| `cinemo-text`        | `#F3EFE6`               | 기본 텍스트                |
| `cinemo-muted`       | `#B0B8B4`               | 설명·보조 텍스트             |
| `cinemo-placeholder` | `#8FB8B3`               | 빈 상태·placeholder 텍스트  |




### 사용 규칙

- Tailwind 클래스에서 `bg-cinemo-*`, `text-cinemo-*`, `border-cinemo-*` 형태로 사용.
- `primary`는 공통 골드(`cinemo-gold`) 기준.
- 시네마 레드는 로그인·특정 강조 상태처럼 제한적인 영역에만 사용.
- 주요 버튼은 알약 형태보다 `rounded-lg` 기반의 직사각형 형태 우선.
- 콘텐츠 영역은 불투명한 박스보다 `cinemo-surface`와 `backdrop-blur` 조합 우선.
- 전역 CSS 변수와 Tailwind 토큰의 기준 파일은 `apps/web/app/globals.css`.



## 외부 API


| 외부 API | 사용하는 정보               |
| ------ | --------------------- |
| KOBIS  | 한국 영화 식별자·개봉 정보·박스오피스 |
| TMDB   | 영화 상세 정보·포스터·배경·장르·영상 |
| KMDb   | 한국어 영화 정보·재개봉 정보·포스터  |


- 외부 API 원본 응답은 API 서버에서 수집·변환한 뒤 CINEMO DB에 저장.
- Web과 Mobile은 외부 API를 직접 호출하지 않고 CINEMO API만 사용.



## Docker

```bash
docker compose up -d
```


| 구분             | 주소               |
| -------------- | ---------------- |
| Mac 호스트        | `localhost:5445` |
| Docker 컨테이너 내부 | `db:5432`        |


DataGrip과 Mac에서 실행하는 앱은 `localhost:5445`로 접속

## 로컬 실행 주소


| 구분           | 주소                               | 용도                       |
| ------------ | -------------------------------- | ------------------------ |
| Web          | `http://localhost:3051`          | CINEMO Web 앱             |
| API          | `http://localhost:3050/api/v1`   | 버전이 포함된 API 기본 경로        |
| Swagger UI   | `http://localhost:3050/api`      | API 문서·Try it out 확인     |
| OpenAPI JSON | `http://localhost:3050/api-json` | OpenAPI 원본 문서·Codegen 입력 |




### Swagger 확인 순서

```text
API 서버 실행
  ↓
http://localhost:3050/api 접속
  ↓
Swagger에서 endpoint 선택
  ↓
Try it out으로 요청·응답 확인
```

- Swagger UI는 API 요청을 직접 테스트하는 용도.
- OpenAPI JSON은 `packages/api-contract`의 OpenAPI Codegen 입력으로 사용.
- Web은 `http://localhost:3051`에서 확인.

## 실행 환경

- Web 로컬: `http://localhost:3051`
- API 로컬: `http://localhost:3050`
- Web 배포: Vercel
- API 배포: Google Cloud Run
- Database: Neon PostgreSQL



## 배포 주소

```text
Web: https://www.cinemo.site
API Swagger: https://api.cinemo.site/api
```

## 이메일 발송

`CINEMO <hello@cinemo.site>`



## Mobile App Identifier

모바일 앱과 웹 딥링크를 연결하기 위해 사용하는 공개 식별자.


| 구분                | 값                         |
| ----------------- | ------------------------- |
| iOS Bundle ID     | `site.cinemo.app`         |
| Android Package   | `site.cinemo.app`         |
| Custom URL Scheme | `cinemo`                  |
| Web Domain        | `https://www.cinemo.site` |




## Web Identifier

Sign in with Apple 웹 인증에 사용하는 Services ID. 모바일 App ID와 구분해서 관리하며, 기존 Sign in with Apple Primary App ID와 연결


| 구분                   | 값                                |
| -------------------- | -------------------------------- |
| Services ID          | `com.cinemo.web`                 |
| 환경변수                 | `APPLE_CLIENT_ID=com.cinemo.web` |
| 연결 대상 Primary App ID | `site.cinemo.app`                |
