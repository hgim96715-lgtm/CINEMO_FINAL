export const DEFAULT_DAILY_MOVIE_PUSH = {
  enabled: false,
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  hour: 20,
  title: "{context}",
  body: "〈{movie}〉 · {reason}",
};

export type DailyMoviePushSettings = typeof DEFAULT_DAILY_MOVIE_PUSH;

export function formatDailyMoviePush(
  settings: Pick<DailyMoviePushSettings, "title" | "body">,
  movie: string,
  reason: string,
  context = "🎬 오늘 시간 나면 이 영화 어때요?",
) {
  const fill = (template: string) => template
    .replace(/\{(movie|reason|context)\}/g, (_, key: string) => key === "movie" ? movie : key === "reason" ? reason : context)
    .trim();
  return { title: fill(settings.title).slice(0, 60), body: fill(settings.body).slice(0, 180) };
}

export function formatDailyMovieSchedule(weekdays: number[], hour: number) {
  if (weekdays.length === 7) return `매일 ${String(hour).padStart(2, "0")}:00 · 한국 시간`;
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const days = [...weekdays].sort((a, b) => a - b).map((day) => dayLabels[day]).join("·");
  return `${days} ${String(hour).padStart(2, "0")}:00 · 한국 시간`;
}

export type DailyMovieWeatherGrid = { nx: number; ny: number };

// KMA DFS Lambert conformal conic grid, with a 5 km cell size.
export function toDailyMovieWeatherGrid(latitude: number, longitude: number): DailyMovieWeatherGrid {
  const radians = Math.PI / 180;
  const tangent = (degrees: number) => Math.tan(Math.PI / 4 + degrees * radians / 2);
  const cone = Math.log(Math.cos(30 * radians) / Math.cos(60 * radians)) /
    Math.log(tangent(60) / tangent(30));
  const scale = 6371.00877 / 5 * tangent(30) ** cone * Math.cos(30 * radians) / cone;
  const originRadius = scale / tangent(38) ** cone;
  const radius = scale / tangent(latitude) ** cone;
  const angle = (longitude - 126) * radians * cone;
  return {
    nx: Math.round(radius * Math.sin(angle) + 43),
    ny: Math.round(originRadius - radius * Math.cos(angle) + 136),
  };
}
