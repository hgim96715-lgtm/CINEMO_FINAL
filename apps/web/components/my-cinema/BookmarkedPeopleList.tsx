"use client";

import Image from "next/image";
import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {UserRound} from "lucide-react";
import {bookmarkedPeopleQueryOptions} from "@/lib/queries/person-bookmark.query";

type PersonRole = "DIRECTOR" | "ACTOR";

const roleLabels: Record<PersonRole, string> = {
  DIRECTOR: "감독",
  ACTOR: "배우",
};

export function BookmarkedPeopleList() {
  const bookmarkedPeopleQuery = useQuery(bookmarkedPeopleQueryOptions());

  if (bookmarkedPeopleQuery.isPending) {
    return (
      <p className="text-sm text-cinemo-muted">저장한 인물을 불러오는 중...</p>
    );
  }

  const people = bookmarkedPeopleQuery.data ?? [];

  if (people.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
        <p className="text-sm text-cinemo-muted">
          저장한 감독이나 배우가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {people.map(({ person }) => (
        <Link
          key={person.id}
          href={`/people/${person.id}`}
          className="flex w-full flex-col items-center rounded-2xl border border-white/10 bg-white/3 p-4 text-center transition hover:border-cinemo-gold/50 hover:bg-white/[0.06]"
        >
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cinemo-gold/40 bg-white/5">
            {person.profileUrl ? (
              <Image
                src={person.profileUrl}
                alt={`${person.name} 프로필`}
                width={64}
                height={64}
                className="size-full object-cover"
              />
            ) : (
              <UserRound className="size-7 text-cinemo-muted" />
            )}
          </span>

          <div className="mt-4 flex w-full min-w-0 flex-col items-center text-center">
            <span className="block w-full truncate font-semibold text-cinemo-text">
              {person.name}
            </span>
            {person.nameEn && (
              <span className="mt-2 block w-full truncate text-xs text-cinemo-muted">
                {person.nameEn}
              </span>
            )}
            {person.roles.length > 0 && (
              <span className="mt-2 flex min-h-6 flex-wrap justify-center gap-1">
                {person.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-md border border-cinemo-gold/30 bg-cinemo-gold/10 px-2 py-0.5 text-[11px] leading-4 text-cinemo-gold"
                  >
                    {roleLabels[role]}
                  </span>
                ))}
              </span>
            )}

          </div>
        </Link>
      ))}
    </div>
  );
}
