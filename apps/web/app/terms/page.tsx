import { CINEMO_LEGAL_DOCUMENTS } from "@cinemo/shared";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "서비스 이용약관 | CINEMO" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-16 leading-relaxed">
      <header>
        <p className="text-sm text-muted-foreground">CINEMO</p>
        <h1 className="mt-2 text-3xl font-bold">서비스 이용약관</h1>
        <p className="mt-2 text-sm text-muted-foreground">운영자 gong (CINEMO) · 대한민국</p>
      </header>
      {CINEMO_LEGAL_DOCUMENTS.service.sections.map(({ title, body }) => (
        <section key={title}>
          <h2 className="mb-2 text-xl font-semibold">{title}</h2>
          <p>{body}</p>
        </section>
      ))}
      <p>문의 <a className="underline" href="mailto:hello_cinemo@icloud.com">hello_cinemo@icloud.com</a></p>
    </main>
  );
}
