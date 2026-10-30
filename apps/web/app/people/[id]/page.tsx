"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  enrichPersonFromTmdb,
  type PersonDetail,
} from "@/lib/api/people";
import { personDetailQueryOptions } from "@/lib/queries/person-detail.query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PersonBookmarkButton } from "@/components/people/PersonBookmarkButton";

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const personQuery = useQuery(personDetailQueryOptions(id));

  const [showFullBiography, setShowFullBiography] = useState(false);
  const [showFullCredits, setShowFullCredits] = useState(false);
  const enrichmentAttemptedRef = useRef<string | null>(null);

  useEffect(() => {
    const person = personQuery.data;
    const tmdbPersonId = Number(person?.tmdbPersonId);

    if (
      !person ||
      !Number.isInteger(tmdbPersonId) ||
      person.credits.length >= 10 ||
      enrichmentAttemptedRef.current === id
    ) {
      return;
    }

    enrichmentAttemptedRef.current = id;
    void enrichPersonFromTmdb(id, tmdbPersonId)
      .then(() => personQuery.refetch())
      .catch(() => {
        // TMDB 보완 실패 시에도 CINEMO DB에 저장된 필모그래피는 계속 표시함
      });
  }, [id, personQuery.data, personQuery.refetch]);

  if (personQuery.isPending) {
    return (
      <main className="min-h-screen bg-[#071619] px-6 py-10 text-white">
        인물 정보를 불러오는 중...
      </main>
    );
  }

  const person: PersonDetail = personQuery.data ?? {
    id,
    tmdbPersonId: null,
    name: "",
    nameEn: null,
    profileUrl: null,
    biography: null,
    birthDate: null,
    birthPlace: null,
    nationality: null,
    credits: [],
  };

  const biography = person.biography?.trim() ?? "";
  const isLongBiography = biography.length > 240;

  const visibleBiography =
    isLongBiography && !showFullBiography
      ? `${biography.slice(0, 240)}...`
      : biography;

  const usableCredits = person.credits.filter(
    (credit) =>
      credit.movie.title.trim() &&
      credit.movie.releaseDate &&
      credit.movie.posterUrl,
  );

  const visibleCredits = showFullCredits
    ? usableCredits
    : usableCredits.slice(0, 3);

  const birthDate = person.birthDate ? person.birthDate.slice(0, 10) : null;

  return (
    <main className="min-h-screen bg-[#071619] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 md:flex md:gap-8">
          <div className="mx-auto w-40 shrink-0 md:mx-0">
            {person.profileUrl ? (
              <img
                src={person.profileUrl}
                alt={`${person.name} 프로필`}
                className="aspect-2/3 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-2/3 items-center justify-center rounded-xl bg-white/10 text-sm text-white/40">
                프로필 이미지 없음
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-0">
            <div className="flex items-center gap-3">
              {person.name ? (
                <h1 className="text-3xl font-bold">{person.name}</h1>
              ) : (
                <div
                  aria-label="인물 이름 없음"
                  className="h-9 w-48 rounded bg-white/10"
                />
              )}

              <PersonBookmarkButton personId={person.id} />
            </div>

            {person.nameEn && (
              <p className="mt-2 text-lg text-white/55">{person.nameEn}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {person.nationality && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">
                  {person.nationality}
                </span>
              )}

              {birthDate && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">
                  {birthDate}
                </span>
              )}

              {person.birthPlace && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/75">
                  {person.birthPlace}
                </span>
              )}
            </div>

            {biography && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold">인물 소개</h2>

                <p className="mt-3 max-w-3xl leading-7 text-white/70">
                  {visibleBiography}
                </p>

                {isLongBiography && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowFullBiography((previous) => !previous)
                    }
                    className="mt-3 text-sm text-cinemo-gold-light"
                  >
                    {showFullBiography ? "접기" : "더보기"}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">필모그래피</h2>

          {usableCredits.length === 0 ? (
            <p className="mt-6 text-white/45">필모그래피 정보가 없습니다.</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {visibleCredits.map((credit) => (
                <Link
                  key={credit.id}
                  href={`/movies/${credit.movie.id}`}
                  className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-cinemo-gold/60"
                >
                  {credit.movie.posterUrl ? (
                    <img
                      src={credit.movie.posterUrl}
                      alt={`${credit.movie.title} 포스터`}
                      loading="lazy"
                      className="h-28 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-white/10 text-center text-xs text-white/40">
                      포스터 없음
                    </div>
                  )}

                  <div className="min-w-0 py-1">
                    <h3 className="font-semibold">{credit.movie.title}</h3>

                    <p className="mt-2 text-sm text-cinemo-gold-light">
                      {credit.creditType === "DIRECTOR"
                        ? "감독"
                        : credit.characterName
                          ? `배우 · ${credit.characterName}`
                          : "배우"}
                    </p>

                    {credit.movie.releaseDate && (
                      <p className="mt-2 text-sm text-white/45">
                        {credit.movie.releaseDate.slice(0, 10)}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {usableCredits.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowFullCredits((previous) => !previous)}
                  className="mt-5 text-sm font-semibold text-cinemo-gold-light transition hover:text-cinemo-gold"
                >
                  {showFullCredits ? "접기" : "필모그래피 더보기"}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
