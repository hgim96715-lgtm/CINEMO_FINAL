import Image from "next/image";
import Link from "next/link";
import type { UnifiedSearchPerson } from "@cinemo/api-contract";

type PersonSearchListProps = {
  people: UnifiedSearchPerson[];
  compact?: boolean;
  onSelect?: () => void;
};

export function PersonSearchList({
  people,
  compact = false,
  onSelect,
}: PersonSearchListProps) {
  return (
    <ul className={compact ? "grid gap-1" : "grid gap-3 sm:grid-cols-2"}>
      {people.map((person) => (
        <li key={person.id} className="overflow-hidden rounded-xl">
          <Link
            href={`/people/${person.id}`}
            onClick={onSelect}
            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/10"
          >
            {person.profileUrl ? (
              <Image
                src={person.profileUrl}
                alt={`${person.name} 프로필`}
                width={compact ? 40 : 56}
                height={compact ? 40 : 56}
                className={`shrink-0 rounded-full object-cover ${compact ? "size-10" : "size-14"}`}
              />
            ) : (
              <span
                className={`flex shrink-0 items-center justify-center rounded-full bg-white/10 text-cinemo-muted ${compact ? "size-10 text-xs" : "size-14 text-sm"}`}
              >
                인물
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-cinemo-text sm:text-base">
                {person.name}
              </span>
              {person.nameEn && (
                <span className="mt-1 block truncate text-xs text-cinemo-muted">
                  {person.nameEn}
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
