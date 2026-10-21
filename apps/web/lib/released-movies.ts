const CINEMO_TIME_ZONE = "Asia/Seoul";

type MovieWithReleaseDate = {
  id: string;
  releaseDate: string | null;
};

export const getCurrentYearAndMonth = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CINEMO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
  };
};

const hash = (value: string) => {
  let result = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }

  return result >>> 0;
};

export const sortMoviesForToday = <T extends MovieWithReleaseDate>(
  movies: T[],
) => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: CINEMO_TIME_ZONE,
  }).format(new Date());

  return [...movies].sort((a, b) => {
    const aScore = hash(`${today}:${a.id}`);
    const bScore = hash(`${today}:${b.id}`);

    return aScore - bScore || a.id.localeCompare(b.id);
  });
};

export const formatReleasedDate = (releaseDate: string | null) => {
  if (!releaseDate) return "개봉일 미정";

  const currentYear = getCurrentYearAndMonth().year;
  const targetDate = new Date(`${releaseDate}T00:00:00+09:00`);
  const targetYear = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: CINEMO_TIME_ZONE,
      year: "numeric",
    }).format(targetDate),
  );

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: CINEMO_TIME_ZONE,
    ...(targetYear !== currentYear ? { year: "numeric" } : {}),
    month: "long",
    day: "numeric",
  }).format(targetDate);
};
