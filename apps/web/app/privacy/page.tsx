import type { Metadata } from "next";

export const metadata: Metadata = { title: "개인정보 처리방침 | CINEMO" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-16 leading-relaxed">
      <header>
        <p className="text-sm text-muted-foreground">CINEMO · 검토용 초안</p>
        <h1 className="mt-2 text-3xl font-bold">개인정보 처리방침</h1>
        <p className="mt-3 text-sm text-muted-foreground">운영자 gong (CINEMO) · 대한민국</p>
      </header>
      <section>
        <h2 className="mb-2 text-xl font-semibold">1. 처리하는 정보와 목적</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>가입·인증 및 계정 보호를 위해 이메일, 닉네임, 로그인 제공자 식별값, 비밀번호 해시(이메일 가입 시), 세션 정보 및 동의 이력을 처리한다.</li>
          <li>프로필 표시와 영화 기록 기능을 위해 선택한 프로필 사진, 영화 저장·관람 기록, 엽서 및 댓글을 처리한다. 공개 엽서와 댓글에는 작성자 정보가 다른 이용자에게 표시될 수 있다.</li>
          <li>신청한 개봉 알림을 보내기 위해 알림 신청 정보, 기기 푸시 토큰과 플랫폼 정보를 처리한다.</li>
          <li>오늘의 영화를 고르는 데 저장·관람 기록을 사용한다. 추천 알림을 켜면 동의 시각, 선택한 기기, 마지막 앱 방문 시각과 발송 시도 날짜를 저장해 발송 조건을 확인한다. 공통 추천 문구를 만들 때 AI에는 영화 제목과 장르를 전달한다.</li>
          <li>서비스 이용 현황 집계를 위해 방문 날짜, 이용 경로(웹 또는 앱), 로그인 여부, 날짜별로 변환된 무작위 방문 식별값을 처리한다.</li>
          <li>엽서 커뮤니티 운영을 위해 신고 대상, 신고 사유와 처리 상태, 차단 관계를 처리한다.</li>
          <li>문의 답변을 위해 문의 내용과 회신에 필요한 연락처를 처리한다.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">2. 보유와 삭제</h2>
        <p>계정 정보는 서비스 이용에 필요한 기간 동안 사용한다. 앱의 내 시네마 → 설정·지원 → 회원 탈퇴에서 계정 삭제를 요청할 수 있다. 계정 삭제 시 계정 정보와 계정에 연결된 관람 기록, 엽서, 댓글, 푸시 토큰 및 차단 관계를 서비스 데이터베이스에서 삭제한다. Apple로 로그인한 계정은 탈퇴 과정에서 Apple 로그인 연결 해제를 요청한다.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">3. 외부 서비스</h2>
        <p>CINEMO는 웹 호스팅에 Vercel, API 운영에 Google Cloud Run, 데이터베이스에 Neon을 사용한다. 소셜 로그인을 선택하면 선택한 로그인 제공자를 통해 인증을 진행한다. 푸시 알림 발송에는 Expo 푸시 서비스를 사용한다.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">4. 이용자 권리와 문의</h2>
        <p>프로필 정보는 내 시네마에서 확인하고 변경할 수 있다. 개인정보 열람, 정정, 삭제 또는 처리 정지 요청은 <a className="underline" href="mailto:hello_cinemo@icloud.com">hello_cinemo@icloud.com</a>으로 접수할 수 있다.</p>
      </section>
    </main>
  );
}
