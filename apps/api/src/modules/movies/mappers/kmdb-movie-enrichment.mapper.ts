import { CreditType } from "@prisma/client";

import type { KmdbMovieResult } from "@/integrations/kmdb/types/kmdb-response.type";

import { SaveKmdbEnrichmentInput } from "../repositories/kmdb-movie-enrichment.repository";

export const cleanKmdbText = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  return value
    .replace(/!HS|!HE/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const toStringArray = (value?: string | string[] | null): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return value
    ? value
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
};

const parseKmdbDate = (value?: string | null): Date | null => {
  if (!value || !/^\d{8}$/.test(value)) {
    return null;
  }

  return new Date(
    Date.UTC(
      Number(value.slice(0, 4)),
      Number(value.slice(4, 6)) - 1,
      Number(value.slice(6, 8)),
    ),
  );
};

const parseRuntime = (
  ...values: Array<string | number | null | undefined>
): number | null => {
  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }

    const runtime = Number(String(value).trim());

    if (Number.isInteger(runtime) && runtime > 0) {
      return runtime;
    }
  }

  return null;
};

const getOverview = (movie: KmdbMovieResult): string | null => {
  const plots = movie.plots?.plot ?? [];
  const plot =
    plots.find((item) => item.plotLang === "한국어")?.plotText ??
    plots[0]?.plotText;

  return cleanKmdbText(plot);
};

const getReleaseDates = (movie: KmdbMovieResult): Date[] => {
  const dates =
    movie.ratings?.rating
      ?.flatMap((rating) =>
        toStringArray(rating.releaseDate).map(parseKmdbDate),
      )
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime()) ?? [];

  return [
    ...new Map(
      dates.map((date) => [date.toISOString().slice(0, 10), date]),
    ).values(),
  ];
};

export const toSaveKmdbEnrichmentInput = (
  movie: KmdbMovieResult,
): SaveKmdbEnrichmentInput => {
  const credits = [
    ...(movie.directors?.director ?? []).map((person) => ({
      name: cleanKmdbText(person.directorNm),
      nameEn: cleanKmdbText(person.directorEnNm),
      externalId: cleanKmdbText(person.directorId),
      creditType: CreditType.DIRECTOR,
    })),
    ...(movie.actors?.actor ?? []).map((person) => ({
      name: cleanKmdbText(person.actorNm),
      nameEn: cleanKmdbText(person.actorEnNm),
      externalId: cleanKmdbText(person.actorId),
      creditType: CreditType.ACTOR,
    })),
  ].filter(
    (
      credit,
    ): credit is {
      name: string;
      nameEn: string | null;
      externalId: string | null;
      creditType: CreditType;
    } => Boolean(credit.name),
  );

  return {
    docId: movie.DOCID,
    title: cleanKmdbText(movie.title),
    runtime: parseRuntime(
      movie.runtime,
      ...(movie.ratings?.rating ?? []).map((rating) => rating.runtime),
    ),
    overview: getOverview(movie),
    releaseDates: getReleaseDates(movie),
    posterUrl: toStringArray(movie.posters)[0] ?? null,
    genres:
      cleanKmdbText(movie.genre)
        ?.split(",")
        .map((genre) => genre.trim())
        .filter(Boolean) ?? [],
    credits,
  };
};
