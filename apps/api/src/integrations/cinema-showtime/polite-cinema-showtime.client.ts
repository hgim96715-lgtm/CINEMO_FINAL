import { BadGatewayException } from "@nestjs/common";

export type CinemaChain = "CGV" | "LOTTE_CINEMA" | "MEGABOX";

export type CinemaShowtime = {
  chain: CinemaChain;
  theaterCode: string;
  theaterName: string;
  movieTitle: string;
  startsAt: string;
  endsAt: string | null;
  screenName: string | null;
  remainingSeats: number | null;
  bookingUrl: string;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_TTL_MS = 10 * 60_000;
const HOST_REQUEST_INTERVAL_MS = 1_500;
const REQUEST_TIMEOUT_MS = 7_000;
const CINEMO_USER_AGENT = "CINEMO-Showtime-Reader/1.0 (+https://www.cinemo.site)";

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const normalizeMovieTitle = (value: string) =>
  value
    .toLocaleLowerCase("ko-KR")
    .normalize("NFKC")
    .replace(/[\s\p{P}\p{S}]+/gu, "");

const toDateTime = (date: string, time: string | undefined) => {
  if (!time || !/^\d{2}:?\d{2}$/.test(time)) return null;
  const normalizedTime = time.includes(":") ? time : `${time.slice(0, 2)}:${time.slice(2)}`;
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${normalizedTime}:00+09:00`;
};

/**
 * 상영시간표 조회는 사용자가 영화 보러가기를 눌렀을 때만 실행함.
 * 자동 순회, 재시도, 좌석 맵·결제·로그인 요청은 의도적으로 만들지 않음.
 */
export class PoliteCinemaShowtimeClient {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly lastRequestedAtByHost = new Map<string, number>();

  async getCgvShowtimes(input: {
    theaterCode: string;
    date: string;
    movieTitle: string;
  }): Promise<CinemaShowtime[]> {
    const payload = await this.getJson<{
      data?: Array<Record<string, unknown>>;
    }>(
      "https://cgv.co.kr/api/v1/booking/searchMovScnInfo",
      {
        coCd: "01",
        siteNo: input.theaterCode,
        scnYmd: input.date,
        rtctlScopCd: "08",
      },
    );
    const targetTitle = normalizeMovieTitle(input.movieTitle);

    return (payload.data ?? [])
      .filter((item) => normalizeMovieTitle(String(item.movNm ?? "")) === targetTitle)
      .map((item) => ({
        chain: "CGV" as const,
        theaterCode: input.theaterCode,
        theaterName: String(item.siteNm ?? "CGV"),
        movieTitle: String(item.movNm),
        startsAt: toDateTime(input.date, String(item.scnsrtTm ?? "")) ?? "",
        endsAt: toDateTime(input.date, String(item.scnendTm ?? "")),
        screenName: item.scnNm ? String(item.scnNm) : null,
        remainingSeats: this.toNumberOrNull(item.frSeatCnt),
        bookingUrl: "https://cgv.co.kr/cnm/movieBook",
      }))
      .filter((showtime) => Boolean(showtime.startsAt));
  }

  async getLotteCinemaShowtimes(input: {
    theaterCode: string;
    date: string;
    movieTitle: string;
  }): Promise<CinemaShowtime[]> {
    const payload = await this.postForm<{
      PlaySeqs?: { Items?: Array<Record<string, unknown>> };
    }>(
      "https://www.lottecinema.co.kr/LCWS/Ticketing/TicketingData.aspx",
      {
        paramList: JSON.stringify({
          MethodName: "GetPlaySequence",
          channelType: "HO",
          osType: "W",
          osVersion: CINEMO_USER_AGENT,
          playDate: `${input.date.slice(0, 4)}-${input.date.slice(4, 6)}-${input.date.slice(6, 8)}`,
          cinemaID: input.theaterCode,
          representationMovieCode: "",
        }),
      },
    );
    const targetTitle = normalizeMovieTitle(input.movieTitle);

    return (payload.PlaySeqs?.Items ?? [])
      .filter((item) => normalizeMovieTitle(String(item.MovieNameKR ?? "")) === targetTitle)
      .map((item) => ({
        chain: "LOTTE_CINEMA" as const,
        theaterCode: input.theaterCode,
        theaterName: String(item.CinemaNameKR ?? "롯데시네마"),
        movieTitle: String(item.MovieNameKR),
        startsAt: toDateTime(input.date, String(item.StartTime ?? "")) ?? "",
        endsAt: toDateTime(input.date, String(item.EndTime ?? "")),
        screenName: item.ScreenNameKR ? String(item.ScreenNameKR) : null,
        remainingSeats: this.toNumberOrNull(item.BookingSeatCount),
        bookingUrl: "https://www.lottecinema.co.kr/NLCHS/Ticketing",
      }))
      .filter((showtime) => Boolean(showtime.startsAt));
  }

  async getMegaboxShowtimes(input: {
    theaterCode: string;
    date: string;
    movieTitle: string;
  }): Promise<CinemaShowtime[]> {
    const payload = await this.postForm<{
      megaMap?: { movieFormList?: Array<Record<string, unknown>> };
    }>(
      "https://www.megabox.co.kr/on/oh/ohc/Brch/schedulePage.do",
      {
        masterType: "brch",
        detailType: "movie",
        brchNo: input.theaterCode,
        firstAt: "N",
        brchNo1: input.theaterCode,
        spclbYn1: "Y",
        theabKindCd1: "",
        crtDe: input.date,
        playDe: input.date,
      },
    );
    const targetTitle = normalizeMovieTitle(input.movieTitle);

    return (payload.megaMap?.movieFormList ?? [])
      .filter((item) => normalizeMovieTitle(String(item.rpstMovieNm ?? item.movieNm ?? "")) === targetTitle)
      .map((item) => ({
        chain: "MEGABOX" as const,
        theaterCode: input.theaterCode,
        theaterName: String(item.brchNm ?? "메가박스"),
        movieTitle: String(item.rpstMovieNm ?? item.movieNm),
        startsAt: toDateTime(input.date, String(item.playStartTime ?? "")) ?? "",
        endsAt: toDateTime(input.date, String(item.playEndTime ?? "")),
        screenName: item.theabExpoNm ? String(item.theabExpoNm) : null,
        remainingSeats: this.toNumberOrNull(item.restSeatCnt),
        bookingUrl: "https://www.megabox.co.kr/booking",
      }))
      .filter((showtime) => Boolean(showtime.startsAt));
  }

  private async getJson<T>(url: string, params: Record<string, string>): Promise<T> {
    const requestUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => requestUrl.searchParams.set(key, value));
    return this.requestJson<T>(requestUrl.toString(), { method: "GET" });
  }

  private async postForm<T>(url: string, fields: Record<string, string>): Promise<T> {
    return this.requestJson<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams(fields).toString(),
    });
  }

  private async requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const cached = this.cache.get(`${init.method}:${url}:${init.body ?? ""}`) as CacheEntry<T> | undefined;
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const host = new URL(url).host;
    const remainingInterval = HOST_REQUEST_INTERVAL_MS - (Date.now() - (this.lastRequestedAtByHost.get(host) ?? 0));
    if (remainingInterval > 0) await delay(remainingInterval);
    this.lastRequestedAtByHost.set(host, Date.now());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { Accept: "application/json", "User-Agent": CINEMO_USER_AGENT, ...init.headers },
      });
      if (!response.ok) throw new BadGatewayException("상영시간표를 불러오지 못했습니다.");
      const value = (await response.json()) as T;
      this.cache.set(`${init.method}:${url}:${init.body ?? ""}`, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      return value;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException("상영시간표 연결이 일시적으로 불안정합니다.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private toNumberOrNull(value: unknown) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
}
