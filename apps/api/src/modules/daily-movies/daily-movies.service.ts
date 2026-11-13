import { DEFAULT_DAILY_MOVIE_PUSH, formatDailyMoviePush, type DailyMovieWeatherGrid, type DailyMoviePushSettings } from "@cinemo/shared/daily-movie-push";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";

import { MoviesService } from "@/modules/movies/movies.service";
import { ExpoPushService } from "@/modules/notifications/expo-push.service";
import { dailyMovieContext } from "./daily-movie-context";
import { DailyMovieRepository } from "./daily-movie.repository";
import {
  toDailyMovieCandidate,
  toDailyMovieCard,
  type DailyMovieCandidate,
  type DailyMovieCard,
} from "./mappers/daily-movie.mapper";

const seoulDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
});
const seoulHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul", hour: "2-digit", hourCycle: "h23",
});
@Injectable()
export class DailyMoviesService {
  private readonly logger = new Logger(DailyMoviesService.name);

  constructor(
    private readonly dailyMovieRepository: DailyMovieRepository,
    private readonly movies: MoviesService,
    private readonly push: ExpoPushService,
  ) {}

  private async publicPick(now: Date, userId?: string, preferredGenres: string[] = []) {
    const day = seoulDate.format(now);
    const popular = await this.movies.getPopularMovies(1, 20);
    const ids = popular.items.filter((movie) => movie.title && movie.posterUrl && !movie.isAdultOnly)
      .map((movie) => movie.id);
    const catalog = await this.dailyMovieRepository.findPopularCatalog(ids, userId);
    const byId = new Map(catalog.map((movie) => [movie.id, movie]));
    const eligible = ids.flatMap((id) => {
      const candidate = byId.get(id);
      const movie = candidate && toDailyMovieCard(candidate);
      return movie ? [movie] : [];
    });
    const seed = Math.floor(Date.parse(day) / 86_400_000);
    const matching = eligible.filter((item) => item.genres.some((genre) => preferredGenres.includes(genre)));
    const candidates = matching.length ? matching : eligible;
    let movie = candidates[seed % candidates.length];
    if (!movie) {
      const fallback = await this.dailyMovieRepository.findPublicFallback(userId);
      const card = fallback && toDailyMovieCard(fallback);
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
    const saved = await this.dailyMovieRepository.findSavedUnwatched(userId);
    const savedMovies = saved.map(({ movie }) => toDailyMovieCard(movie)).filter((movie): movie is DailyMovieCard => movie !== null);
    const savedPick = (movie: DailyMovieCard) => ({
      movie, copy: "저장해 둔 이 영화, 오늘 볼까요?", reason: "찜해 둔 영화, 오늘 한 편 볼까요?",
    });
    if (savedMovies.length > 1) return savedPick(savedMovies[dayIndex % savedMovies.length]);

    const watched = await this.dailyMovieRepository.findWatchedGenres(userId);
    const counts = new Map<string, number>();
    for (const record of watched) {
      for (const { name } of record.movie.movieGenres) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    const genre = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    const alternatives = await this.dailyMovieRepository.findTasteAlternatives(userId, genre, savedMovies[0]?.id);
    const candidates = alternatives.map(toDailyMovieCard).filter((movie): movie is DailyMovieCard => movie !== null);
    if (candidates.length + savedMovies.length < 2 && genre) {
      const fallback = await this.dailyMovieRepository.findTasteFallback(userId, [...savedMovies, ...candidates].map(({ id }) => id));
      const card = fallback && toDailyMovieCard(fallback);
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
    const stored = await this.dailyMovieRepository.findPreparedPick(day, userId);
    const featured = stored && toDailyMovieCard(stored.movie);
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
    const existing = await this.dailyMovieRepository.findPick(day);
    if (existing) return;
    const settings = await this.pushSettings();
    const evening = new Date(`${day}T${String(settings.hour).padStart(2, "0")}:00:00+09:00`);
    const context = await dailyMovieContext(evening);
    const recent = await this.dailyMovieRepository.findRecentPickMovieIds();
    const pool = await this.dailyMovieRepository.findHiddenGemCandidates(context.genres, recent.map(({ movieId }) => movieId));
    const movies = pool
      .map(toDailyMovieCandidate)
      .filter((movie): movie is DailyMovieCandidate => movie !== null);
    if (!movies.length) return;
    const result = await choose({ mood: context.headline, movies });
    const copy = typeof result?.reason === "string" ? result.reason.replace(/\s+/g, " ").trim().slice(0, 160) : "";
    if (!copy || !movies.some(({ id }) => id === result.movieId)) return;
    await this.dailyMovieRepository.createPick(day, result.movieId, copy);
  }

  async weatherRegion(userId: string): Promise<DailyMovieWeatherGrid | null> {
    const user = await this.dailyMovieRepository.findWeatherRegion(userId);
    if (user?.dailyMovieWeatherNx == null || user.dailyMovieWeatherNy == null) return null;
    return { nx: user.dailyMovieWeatherNx, ny: user.dailyMovieWeatherNy };
  }

  async setWeatherRegion(userId: string, grid: DailyMovieWeatherGrid | null) {
    await this.dailyMovieRepository.updateWeatherRegion(userId, grid?.nx ?? null, grid?.ny ?? null);
    return grid;
  }

  async pushSettings(): Promise<DailyMoviePushSettings> {
    const saved = await this.dailyMovieRepository.findPushSettings();
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
    await this.dailyMovieRepository.savePushSettings(data);
    return data;
  }

  async preference(userId: string) {
    const current = await this.dailyMovieRepository.findPreference(userId);
    return { enabled: current?.pushToken.userId === userId };
  }

  async setPreference(userId: string, enabled: boolean, pushTokenId?: string) {
    if (!enabled) {
      await this.dailyMovieRepository.deletePreference(userId);
      return { enabled: false };
    }
    const token = pushTokenId && await this.dailyMovieRepository.findPushToken(userId, pushTokenId);
    if (!token) throw new BadRequestException("이 기기에서 알림을 허용해 주세요.");

    const now = new Date();
    await this.dailyMovieRepository.savePreference(userId, token.id, now);
    return { enabled: true };
  }

  async visit(userId: string) {
    const now = new Date();
    const today = new Date(`${seoulDate.format(now)}T00:00:00+09:00`);
    await this.dailyMovieRepository.recordVisit(userId, today, now);
  }

  async sendDue(now = new Date()) {
    const day = seoulDate.format(now);
    const start = new Date(`${day}T00:00:00+09:00`);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    const settings = await this.pushSettings();
    if (!settings.enabled || !settings.weekdays.includes(weekday) ||
        Number(seoulHour.format(now)) !== settings.hour) return 0;

    const dueInput = { day, start, now };
    let cursor: string | undefined;
    let sent = 0;
    while (true) {
      const batch = await this.dailyMovieRepository.findDueUserIds(dueInput, cursor);
      if (batch.length === 0) return sent;
      cursor = batch[batch.length - 1].userId;

      for (const { userId } of batch) {
        try {
          const pick = await this.today(userId, now);
          if (!pick) continue;

          // 같은 사용자·날짜에 한 번만 발송을 시도한다. 네트워크 결과가 모호해도 중복 발송하지 않는다.
          const token = await this.dailyMovieRepository.claimDeliveryToken(userId, dueInput);
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
