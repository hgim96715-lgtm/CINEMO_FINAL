import type { Metadata } from "next";

export const metadata: Metadata = { title: "서비스 이용약관 | CINEMO" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-16 leading-relaxed">
      <header>
        <p className="text-sm text-muted-foreground">CINEMO · 검토용 초안</p>
        <h1 className="mt-2 text-3xl font-bold">서비스 이용약관</h1>
        <p className="mt-3 text-sm text-muted-foreground">운영자 gong (CINEMO) · 대한민국</p>
      </header>
      <section>
        <h2 className="mb-2 text-xl font-semibold">1. 서비스와 계정</h2>
        <p>CINEMO는 영화 정보, 개인 관람 기록, 엽서와 댓글, 개봉 알림 기능을 제공한다. 회원은 본인 계정을 사용하고 로그인 정보를 보호해야 한다. 회원은 내 시네마의 설정·지원에서 회원 탈퇴를 요청할 수 있다.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">2. 엽서와 댓글</h2>
        <p>회원은 게시물에 대한 권리를 보유한다. CINEMO는 게시물을 저장하고 회원이 지정한 공개 범위에 따라 표시하는 데 필요한 범위에서 게시물을 사용한다. 회원은 게시 권한이 있는 콘텐츠를 등록하고 타인의 저작권과 개인정보를 존중해야 한다.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">3. 금지 행위와 신고</h2>
        <p>괴롭힘, 혐오 표현, 불법 콘텐츠 게시, 타인의 개인정보 공개, 사칭, 스팸 및 서비스 운영을 방해하는 행위를 금지한다. 공개 엽서와 댓글은 앱에서 신고할 수 있다. 회원은 작성자를 차단하거나 설정·지원에서 차단을 해제할 수 있다. 운영자는 신고 내용을 확인해 게시물의 노출을 제한하거나 삭제할 수 있다. 신고 처리나 조치에 대한 문의는 고객지원으로 접수할 수 있다.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-semibold">4. 약관 변경과 고객지원</h2>
        <p>약관을 변경하는 경우 적용일과 주요 변경 내용을 서비스에서 안내한다. 서비스 이용 및 신고 관련 문의는 <a className="underline" href="mailto:hello_cinemo@icloud.com">hello_cinemo@icloud.com</a>으로 접수할 수 있다.</p>
      </section>
    </main>
  );
}
