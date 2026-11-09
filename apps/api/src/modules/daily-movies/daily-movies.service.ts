import { DEFAULT_DAILY_MOVIE_PUSH, formatDailyMoviePush, type DailyMovieWeatherGrid, type DailyMoviePushSettings } from "@cinemo/shared/daily-movie-push";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { MoviesService } from "@/modules/movies/movies.service";
import { ExpoPushService } from "@/modules/notifications/expo-push.service";
import { PrismaService } from "@/prisma/prisma.service";
import { dailyMovieContext } from "./daily-movie-context";

const seoulDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});
const seoulHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul", hour: "2-digit", hourCycle: "h23",
});
const movieFilter: Prisma.MovieWhereInput = {
  visibility: "PUBLIC",
  releases: { some: { status: "RELEASED" } },
  media: { some: { mediaType: "POSTER", status: "ACTIVE" } },
  movieCertifications: {
    none: { OR: [
      { watchGradeName: { contains: "청소년" } },
      { watchGradeName: { contains: "19세" } },
    ] },
  },
};
const movieSelect = {
  id: true,
  titles: {
    orderBy: [{ titleType: "asc" }, { createdAt: "asc" }],
    select: { title: true, languageCode: true },
  },
  media: {
    where: { mediaType: "POSTER", status: "ACTIVE" },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    select: { url: true },
    take: 1,
  },
  movieGenres: { select: { name: true } },
} satisfies Prisma.MovieSelect;

function movieCard(movie: Prisma.MovieGetPayload<{ select: typeof movieSelect }>) {
  const title = movie.titles.find((item) => item.languageCode?.startsWith("ko") || /[가-힣]/u.test(item.title))
    ?? movie.titles[0];
  if (!title || !movie.media[0]) return null;
  return {
    id: movie.id, title: title.title, posterUrl: movie.media[0].url,
    genres: movie.movieGenres.map(({ name }) => name),
  };
}

@Injectable()
export class DailyMoviesService {
  private readonly logger = new Logger(DailyMoviesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly movies: MoviesService,
    private readonly push: ExpoPushService,
  ) {}

  private async publicPick(now: Date, userId?: string, preferredGenres: string[] = []) {
    const filter: Prisma.MovieWhereInput = userId
      ? { ...movieFilter, userMovieRecords: { none: { userId, isWatched: true } } }
      : movieFilter;
    const day = seoulDate.format(now);
    const popular = await this.movies.getPopularMovies(1, 20);
    const ids = popular.items.filter((movie) => movie.title && movie.posterUrl && !movie.isAdultOnly)
      .map((movie) => movie.id);
    const catalog = ids.length > 0
      ? await this.prisma.movie.findMany({ where: { ...filter, id: { in: ids } }, select: movieSelect })
      : [];
    const byId = new Map(catalog.map((movie) => [movie.id, movie]));
    const eligible = ids.flatMap((id) => {
      const candidate = byId.get(id);
      const movie = candidate && movieCard(candidate);
      return movie ? [movie] : [];
    });
    const seed = Math.floor(Date.parse(day) / 86_400_000);
    const matching = eligible.filter((item) => item.genres.some((genre) => preferredGenres.includes(genre)));
    const candidates = matching.length ? matching : eligible;
    let movie = candidates[seed % candidates.length];
    if (!movie) {
      const fallback = await this.prisma.movie.findFirst({
        where: { ...filter, titles: { some: {} } },
        orderBy: [{ tmdbVoteCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
        select: movieSelect,
      });
      const card = fallback && movieCard(fallback);
      if (!card) return null;
      movie = card;
    }

    return {
      movie,
      copy: Number(seoulHour.format(now)) >= 18
        ? "하루를 마무리하며 이 영화 한 편 어때요?"
        : "오늘의 영화로 이 작품을 골랐어요.",
      reason: this.discoveryReason(movie.genres, userId),
      prepared: false,
    };
  }

  private discoveryReason(genres: string[], userId?: string) {
    const category = genres.slice(0, 2).join("·");
    if (userId) return category
      ? `아직 관람 기록이 없는 ${category} 작품이에요.`
      : "관람 기록이 없는 작품에서 골랐어요.";
    return category ? `오늘 살펴볼 ${category} 작품이에요.` : "개봉한 작품 중에서 골랐어요.";
  }

  private async personalPick(userId: string, dayIndex: number) {
    const saved = await this.prisma.userMovieRecord.findMany({
      where: { userId, isFavorite: true, isWatched: false, movie: movieFilter },
      orderBy: [{ updatedAt: "desc" }, { movieId: "asc" }],
      select: { movie: { select: movieSelect } },
      take: 5,
    });
    const savedMovies = saved.map(({ movie }) => movieCard(movie)).filter((movie) => movie !== null);
    const savedPick = (movie: (typeof savedMovies)[number]) => ({
      movie, copy: "저장해 둔 이 영화, 오늘 볼까요?", reason: "찜해 둔 영화, 오늘 한 편 볼까요?",
    });
    if (savedMovies.length > 1) return savedPick(savedMovies[dayIndex % savedMovies.length]);

    const watched = await this.prisma.userMovieRecord.findMany({
      where: { userId, isWatched: true },
      orderBy: { watchedAt: { sort: "desc", nulls: "last" } },
      select: { movie: { select: { movieGenres: { select: { name: true } } } } },
      take: 20,
    });
    const counts = new Map<string, number>();
    for (const record of watched) {
      for (const { name } of record.movie.movieGenres) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    const genre = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    const alternatives = await this.prisma.movie.findMany({
      where: {
        ...movieFilter,
        titles: { some: {} },
        ...(genre && { movieGenres: { some: { name: genre } } }),
        ...(savedMovies[0] && { id: { not: savedMovies[0].id } }),
        userMovieRecords: { none: { userId, isWatched: true } },
      },
      orderBy: [{ tmdbVoteCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      select: movieSelect,
      take: 20,
    });
    const candidates = alternatives.map(movieCard).filter((movie) => movie !== null);
    if (candidates.length + savedMovies.length < 2 && genre) {
      const fallback = await this.prisma.movie.findFirst({
        where: {
          ...movieFilter,
          titles: { some: {} },
          id: { notIn: [...savedMovies, ...candidates].map(({ id }) => id) },
          userMovieRecords: { none: { userId, isWatched: true } },
        },
        orderBy: [{ tmdbVoteCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
        select: movieSelect,
      });
      const card = fallback && movieCard(fallback);
      if (card) candidates.push(card);
    }

    const pool = [...savedMovies, ...candidates];
    const movie = pool[dayIndex % pool.length];
    if (!movie) return null;
    if (movie.id === savedMovies[0]?.id) return savedPick(movie);
    const matchesTaste = genre && movie.genres.includes(genre);
    return {
      movie,
      copy: matchesTaste ? `자주 본 ${genre} 장르에서 골랐어요.` : "오늘 이 영화 한 편 어때요?",
      reason: matchesTaste ? `즐겨 보는 ${genre} 장르에서 아직 안 본 작품을 골랐어요.` : this.discoveryReason(movie.genres, userId),
    };
  }

  async today(userId?: string, now = new Date()) {
    const day = seoulDate.format(now);
    const context = await dailyMovieContext(now, userId ? await this.weatherRegion(userId) ?? undefined : undefined);
    const stored = await this.prisma.dailyMoviePick.findFirst({
      where: {
        day,
        movie: userId
          ? { ...movieFilter, userMovieRecords: { none: { userId, isWatched: true } } }
          : movieFilter,
      },
      select: { copy: true, movie: { select: movieSelect } },
    });
    const featured = stored && movieCard(stored.movie);
    const useFeatured = featured && (!context.weather || featured.genres.some((genre) => context.genres.includes(genre)));
    const pick = useFeatured && stored
      ? { movie: featured, copy: stored.copy, reason: stored.copy, prepared: true }
      : (userId && await this.personalPick(userId, Math.floor(Date.parse(day) / 86_400_000))) || await this.publicPick(now, userId, context.genres);
    return pick ? {
      day,
      headline: context.headline,
      weatherSource: context.weather ? "기상청 · 설정한 지역 기준" : null,
      movie: pick.movie,
      copy: pick.copy,
      reason: pick.reason,
      hasPreparedCopy: "prepared" in pick && pick.prepared,
    } : null;
  }

  async prepareHiddenGem(
    choose: (input: { mood: string; movies: { id: string; title: string; genres: string[]; overview: string }[] }) =>
      Promise<{ movieId: string; reason: string }>,
    now = new Date(),
  ) {
    const day = seoulDate.format(now);
    const existing = await this.prisma.dailyMoviePick.findUnique({ where: { day }, select: { day: true } });
    if (existing) return;
    const settings = await this.pushSettings();
    const evening = new Date(`${day}T${String(settings.hour).padStart(2, "0")}:00:00+09:00`);
    const context = await dailyMovieContext(evening);
    const recent = await this.prisma.dailyMoviePick.findMany({
      orderBy: { day: "desc" }, take: 7, select: { movieId: true },
    });
    const pool = await this.prisma.movie.findMany({
      where: {
        ...movieFilter,
        id: { notIn: recent.map(({ movieId }) => movieId) },
        overview: { not: null },
        tmdbVoteCount: { gte: 50, lte: 2500 },
        tmdbVoteAverage: { gte: 7 },
        movieGenres: { some: { name: { in: context.genres } } },
      },
      orderBy: [{ tmdbVoteAverage: "desc" }, { tmdbVoteCount: "desc" }, { id: "asc" }],
      select: { ...movieSelect, overview: true },
      take: 16,
    });
    const movies = pool.flatMap((candidate) => {
      const movie = movieCard(candidate);
      const overview = candidate.overview?.trim().slice(0, 420);
      return movie && overview ? [{ id: movie.id, title: movie.title, genres: movie.genres, overview }] : [];
    });
    if (!movies.length) return;
    const result = await choose({ mood: context.headline, movies });
    const copy = typeof result?.reason === "string" ? result.reason.replace(/\s+/g, " ").trim().slice(0, 160) : "";
    if (!copy || !movies.some(({ id }) => id === result.movieId)) return;
    await this.prisma.dailyMoviePick.createMany({
      data: { day, movieId: result.movieId, copy },
      skipDuplicates: true,
    });
  }

  async weatherRegion(userId: string): Promise<DailyMovieWeatherGrid | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyMovieWeatherNx: true, dailyMovieWeatherNy: true },
    });
    if (user?.dailyMovieWeatherNx == null || user.dailyMovieWeatherNy == null) return null;
    return { nx: user.dailyMovieWeatherNx, ny: user.dailyMovieWeatherNy };
  }

  async setWeatherRegion(userId: string, grid: DailyMovieWeatherGrid | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyMovieWeatherNx: grid?.nx ?? null, dailyMovieWeatherNy: grid?.ny ?? null },
    });
    return grid;
  }

  async pushSettings(): Promise<DailyMoviePushSettings> {
    const saved = await this.prisma.dailyMoviePushSettings.findUnique({
      where: { id: 1 },
      select: { enabled: true, weekdays: true, hour: true, title: true, body: true },
    });
    if (!saved) return DEFAULT_DAILY_MOVIE_PUSH;
    if (saved.title === "🎬 오늘의 영화" && saved.body === "{movie}\n{reason}") {
      return { ...saved, title: DEFAULT_DAILY_MOVIE_PUSH.title, body: DEFAULT_DAILY_MOVIE_PUSH.body };
    }
    return saved;
  }

  async updatePushSettings(input: DailyMoviePushSettings) {
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title || !body || !`${title} ${body}`.includes("{movie}")) {
      throw new BadRequestException("제목과 본문을 입력하고, 영화 제목 변수 {movie}를 넣어 주세요.");
    }
    const data = { ...input, weekdays: [...input.weekdays].sort((a, b) => a - b), title, body };
    await this.prisma.dailyMoviePushSettings.upsert({
      where: { id: 1 }, create: { id: 1, ...data }, update: data,
    });
    return data;
  }

  async preference(userId: string) {
    const current = await this.prisma.dailyMoviePreference.findUnique({
      where: { userId }, select: { pushToken: { select: { userId: true } } },
    });
    return { enabled: current?.pushToken.userId === userId };
  }

  async setPreference(userId: string, enabled: boolean, pushTokenId?: string) {
    if (!enabled) {
      await this.prisma.dailyMoviePreference.deleteMany({ where: { userId } });
      return { enabled: false };
    }
    const token = pushTokenId && await this.prisma.pushToken.findFirst({
      where: { id: pushTokenId, userId }, select: { id: true },
    });
    if (!token) throw new BadRequestException("이 기기에서 알림을 허용해 주세요.");

    const now = new Date();
    await this.prisma.dailyMoviePreference.upsert({
      where: { userId },
      create: { userId, pushTokenId: token.id, enabledAt: now, lastVisitAt: now },
      update: { pushTokenId: token.id, enabledAt: now, lastVisitAt: now },
    });
    return { enabled: true };
  }

  async visit(userId: string) {
    const now = new Date();
    const today = new Date(`${seoulDate.format(now)}T00:00:00+09:00`);
    await this.prisma.dailyMoviePreference.updateMany({
      where: { userId, lastVisitAt: { lt: today } },
      data: { lastVisitAt: now },
    });
  }

  async sendDue(now = new Date()) {
    const day = seoulDate.format(now);
    const start = new Date(`${day}T00:00:00+09:00`);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    const settings = await this.pushSettings();
    if (!settings.enabled || !settings.weekdays.includes(weekday) ||
        Number(seoulHour.format(now)) !== settings.hour) return 0;

    const eligible: Prisma.DailyMoviePreferenceWhereInput = {
      lastVisitAt: { lt: start },
      user: {
        status: "ACTIVE",
        mobileRefreshTokens: { some: { expiresAt: { gt: now }, revokedAt: null } },
        dailyMovieDeliveries: { none: { day } },
      },
    };
    let cursor: string | undefined;
    let sent = 0;
    while (true) {
      const batch = await this.prisma.dailyMoviePreference.findMany({
        where: { ...eligible, ...(cursor && { userId: { gt: cursor } }) },
        orderBy: { userId: "asc" },
        select: { userId: true },
        take: 100,
      });
      if (batch.length === 0) return sent;
      cursor = batch[batch.length - 1].userId;

      for (const { userId } of batch) {
        try {
          const pick = await this.today(userId, now);
          if (!pick) continue;

          // 같은 사용자·날짜에 한 번만 발송을 시도한다. 네트워크 결과가 모호해도 중복 발송하지 않는다.
          const token = await this.prisma.$transaction(async (tx) => {
            const preference = await tx.dailyMoviePreference.findFirst({
              where: { ...eligible, userId, pushToken: { userId } },
              select: { pushToken: { select: { token: true } } },
            });
            if (!preference) return null;
            const claimed = await tx.dailyMovieDelivery.createMany({
              data: { userId, day },
              skipDuplicates: true,
            });
            return claimed.count ? preference.pushToken.token : null;
          });
          if (!token) continue;

          const tickets = await this.push.send([{
            to: token,
            ...formatDailyMoviePush(settings, pick.movie.title, pick.reason, pick.headline),
            data: { type: "daily-movie", movieId: pick.movie.id },
          }]);
          if (tickets.some((ticket) => ticket.status === "ok")) sent++;
        } catch {
          this.logger.warn("오늘의 영화 알림 한 건을 처리하지 못했습니다.");
        }
      }
    }
  }
}
