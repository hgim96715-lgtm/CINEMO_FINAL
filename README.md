# CINEMO

`CINEMO`는 **Cinema**와 **Motion**의 결합.
영화가 한 편의 영상으로 끝나지 않고, 기록과 사람 사이에서 계속 움직인다는 의미를 담았습니다.

> 영화 속으로, 추억의 한 장면으로

보고 싶은 영화를 발견하고, 관람 기록과 엽서로 영화의 여운을 쌓아가는 영화 기록 서비스.

[웹 서비스](https://www.cinemo.site) · [서비스 이용약관](https://www.cinemo.site/terms) · [개인정보 처리방침](https://www.cinemo.site/privacy) · [API 문서](https://api.cinemo.site/api)

## 제품 상태

- Web: 운영 중 — `https://www.cinemo.site`
- iOS: 심사 제출 빌드 `1.0.0 (6)`, 다음 업로드용 빌드 `1.0.0 (7)`, 수동 출시 방식
- 지원 기기: iPhone 및 iPad, 세로 화면
- 운영자: gong (CINEMO), 대한민국
- 고객지원: `hello_cinemo@icloud.com`

## 주요 기능

- **영화 탐색**: 박스오피스, 개봉 예정작, 기념일·플랫폼별 목록, 한국어·원제 검색
- **개인 기록**: 저장·관람 완료·평점·관람일·관람처 기록과 저장한 인물 관리
- **오늘의 영화**: 아직 보지 않은 영화, 관심 장르, 시간대·날씨 맥락을 반영한 추천 이유 제공
- **내 우주**: 관람 기록을 별과 별자리로 시각화하고 확대·이동·선택 가능
- **엽서**: 영화 인용구·감상을 작성, 공개, 수정, 삭제, 댓글·대댓글·반응·공유 지원
- **커뮤니티 안전**: 엽서·댓글 신고, 사용자 차단, 탈퇴 사용자 댓글 표기, 관리자 검토
- **알림**: 개봉 알림과 오늘의 영화 푸시 알림. 운영자가 관리자 화면에서 발송 시간·문구 관리
- **운영 도구**: 영화 공개 상태, 큐레이션, 신고, 방문 현황, 추천 알림 설정 관리

## 알림 운영

- **오늘의 영화**: 기본값은 매일 `20:00` · 한국 시간(`Asia/Seoul`). 사용자가 알림을 켜고 기기 권한을 허용한 경우에만 발송
- **개봉 알림**: 매일 `09:00` · 한국 시간에 개봉 대상 영화를 확인하고, 개별 영화 알림을 신청한 사용자에게 발송함
- 오늘 이미 앱을 방문했거나 수신을 끈 사용자는 오늘의 영화 알림 대상에서 제외함
- 오늘의 영화 알림의 사용 여부·요일·시간·제목·본문은 관리자 화면에서 변경 가능. 실제 운영 설정이 기본값보다 우선함

## 구성

```text
apps/
├── api/       NestJS + Prisma API, 배치 작업, 푸시·메일·외부 영화 연동
├── web/       Next.js 웹 서비스 및 관리자 화면
└── mobile/    Expo / React Native iOS·Android 앱

packages/
├── api-contract/  OpenAPI 기반 공유 API 타입
└── shared/        화면·추천·알림에 쓰는 공통 타입과 유틸리티
```

## 기술 스택

- Web: Next.js, React, TypeScript, TanStack Query, Tailwind CSS
- Mobile: Expo, React Native, Expo Router, React Query
- API: NestJS, Prisma, PostgreSQL, Swagger
- 운영: Vercel(Web), Google Cloud Run(API), Neon PostgreSQL
- 연동: KOBIS, TMDB, KMDb, Kakao Local, 기상청, OpenSubtitles, SubDL, Expo Push, Resend
- AI·번역: OpenAI — 오늘의 영화 추천, 자막 기반 명대사 후보 선별, 원문 한국어 번역
