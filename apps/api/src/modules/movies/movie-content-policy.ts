const EXPLICIT_TITLE_MARKERS = [
  "체액",
  "섹스",
  "야한",
  "마사지클럽",
  "19금",
  "성인물",
] as const;

export const explicitMovieTitleMarkers = [...EXPLICIT_TITLE_MARKERS];

const normalize = (value: string): string =>
  value.replace(/\s+/g, "").toLowerCase();

export const containsExplicitMovieTitle = (title: string): boolean => {
  const normalizedTitle = normalize(title);

  return EXPLICIT_TITLE_MARKERS.some((marker) =>
    normalizedTitle.includes(normalize(marker)),
  );
};

export const isExplicitKobisMovie = (input: {
  title: string;
  typeName?: string | null;
  genres?: string[];
}): boolean => {
  const metadata = [input.typeName ?? "", ...(input.genres ?? [])]
    .map(normalize)
    .join(" ");

  return (
    containsExplicitMovieTitle(input.title) ||
    metadata.includes("성인물") ||
    metadata.includes("에로")
  );
};

const isAdultCertification = (certifications: string[] = []): boolean =>
  certifications.some((certification) => {
    const normalizedCertification = normalize(certification);

    return (
      normalizedCertification.includes("청소년관람불가") ||
      normalizedCertification.includes("19세")
    );
  });

const isRomanceGenre = (genres: string[] = []): boolean =>
  genres.some((genre) => {
    const normalizedGenre = normalize(genre);
    return normalizedGenre.includes("멜로") || normalizedGenre.includes("로맨스");
  });

export const getKobisMovieVisibility = (input: {
  title: string;
  typeName?: string | null;
  genres?: string[];
  certifications?: string[];
}): { visibility: MovieVisibility; moderationReason: string | null } => {
  if (isAdultCertification(input.certifications) && isRomanceGenre(input.genres)) {
    return {
      visibility: MovieVisibility.HIDDEN,
      moderationReason: "자동 분류: 19금 멜로/로맨스",
    };
  }

  if (isExplicitKobisMovie(input)) {
    return {
      visibility: MovieVisibility.REVIEW,
      moderationReason: "자동 분류: 성인물 검토 필요",
    };
  }

  return {
    visibility: MovieVisibility.PUBLIC,
    moderationReason: null,
  };
};
import { MovieVisibility } from "@prisma/client";
