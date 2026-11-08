import Link from "next/link";

const links = [
  { href: "/admin/postcard-reports", label: "엽서·댓글 신고" },
  { href: "/admin/visits", label: "방문 현황" },
  { href: "/admin/users", label: "회원·접속 현황" },
  { href: "/admin/movies", label: "영화 검색" },
  { href: "/admin/curations", label: "큐레이션 관리" },
];

export function AdminNavigation() {
  return (
    <nav aria-label="관리자 메뉴" className="mb-8 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-cinemo-muted transition hover:border-cinemo-gold/30 hover:bg-cinemo-gold/10 hover:text-cinemo-gold-light"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
