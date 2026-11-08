import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { MoviesService } from "@/modules/movies/movies.service";
import { ExpoPushService } from "@/modules/notifications/expo-push.service";
import { PrismaService } from "@/prisma/prisma.service";

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

  private async publicPick(now: Date, userId?: string) {
    const filter: Prisma.MovieWhereInput = userId
      ? { ...movieFilter, userMovieRecords: { none: { userId, isWatched: true } } }
      : movieFilter;
    const day = seoulDate.format(now);
    const stored = await this.prisma.dailyMoviePick.findFirst({
      where: { day, movie: filter },
      select: { copy: true, movie: { select: movieSelect } },
    });
    const storedMovie = stored && movieCard(stored.movie);
    if (storedMovie && stored) return { movie: storedMovie, copy: stored.copy, reason: this.discoveryReason(storedMovie.genres, userId), prepared: true };

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
    let movie = eligible[seed % eligible.length];
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

  private async personalPick(userId: string) {
    const saved = await this.prisma.userMovieRecord.findMany({
      where: { userId, isFavorite: true, isWatched: false, movie: movieFilter },
      orderBy: [{ updatedAt: "desc" }, { movieId: "asc" }],
      select: { movie: { select: movieSelect } },
      take: 5,
    });
    for (const record of saved) {
      const movie = movieCard(record.movie);
      if (movie) return { movie, copy: "저장해 둔 이 영화, 오늘 볼까요?", reason: "저장해 두고 아직 보지 않은 영화예요." };
    }

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
    if (!genre) return null;

    const candidate = await this.prisma.movie.findFirst({
      where: {
        AND: [movieFilter, { movieGenres: { some: { name: genre } } }],
        userMovieRecords: { none: { userId, isWatched: true } },
      },
      orderBy: [{ tmdbVoteCount: { sort: "desc", nulls: "last" } }, { id: "asc" }],
      select: movieSelect,
    });
    const movie = candidate && movieCard(candidate);
    return movie ? { movie, copy: `자주 본 ${genre} 장르에서 골랐어요.`, reason: `자주 본 ${genre} 장르의 미관람 영화예요.` } : null;
  }

  async today(userId?: string, now = new Date()) {
    const day = seoulDate.format(now);
    const pick = (userId && await this.personalPick(userId)) || await this.publicPick(now, userId);
    return pick ? {
      day,
      movie: pick.movie,
      copy: pick.copy,
      reason: pick.reason,
      hasPreparedCopy: "prepared" in pick && pick.prepared,
    } : null;
  }

  async prepareCopy(generate: (movie: { title: string; genres: string[] }) => Promise<string>, now = new Date()) {
    const pick = await this.publicPick(now);
    if (!pick || pick.prepared) return;

    const copy = (await generate(pick.movie)).replace(/\s+/g, " ").trim().slice(0, 160);
    if (!copy) return;
    await this.prisma.dailyMoviePick.createMany({
      data: { day: seoulDate.format(now), movieId: pick.movie.id, copy },
      skipDuplicates: true,
    });
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
    if (![2, 5].includes(weekday) || seoulHour.format(now) !== "20") return 0;

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
            title: "오늘의 영화",
            body: `${pick.movie.title} · ${pick.reason}`.slice(0, 160),
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
