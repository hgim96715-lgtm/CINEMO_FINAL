import Image from "next/image";
import type {MovieResponse} from "@cinemo/api-contract";

type MovieWatchOptionsProps = {
  watchOptions: MovieResponse["watchOptions"];
  movieTitle: string;
};

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

type WatchProvider = MovieResponse["watchOptions"][number]["watchProvider"];

const providerSearchUrls: Partial<Record<WatchProvider, string>> = {
  NETFLIX: "https://www.netflix.com/kr/search?q=",
  WATCHA: "https://pedia.watcha.com/ko/search?query=",
  TVING: "https://www.tving.com/search?query=",
  DISNEY_PLUS: "https://www.disneyplus.com/ko-kr/search?q=",
  WAVVE: "https://www.wavve.com/search?searchWord=",
  APPLE_TV: "https://tv.apple.com/kr/search?term=",
  PRIME_VIDEO: "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=",
};

const getProviderHref = (provider: WatchProvider, movieTitle: string, fallbackUrl: string) => {
  const searchUrl = providerSearchUrls[provider];

  return searchUrl
    ? `${searchUrl}${encodeURIComponent(movieTitle)}`
    : fallbackUrl;
};

export function MovieWatchOptions({
  watchOptions,
  movieTitle,
}: MovieWatchOptionsProps) {
  const providers = Array.from(
    new Map(
      watchOptions.map((option) => [
        option.tmdbProviderId ?? option.watchProvider,
        option,
      ]),
    ).values(),
  );

  if (providers.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">어디서 볼 수 있나요?</p>
          <p className="mt-1 text-xs text-white/45">
            대한민국에서 이용 가능한 플랫폼
          </p>
        </div>

        <span className="text-xs text-white/40">
          {providers.length}개 플랫폼
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-6">
        {providers.map((provider) => (
          <a
            key={`${provider.tmdbProviderId ?? provider.watchProvider}`}
            href={getProviderHref(provider.watchProvider, movieTitle, provider.url)}
            target="_blank"
            rel="noreferrer"
            title={`${provider.watchProvider}에서 보기`}
            className="flex h-12 items-center justify-start"
          >
            {provider.logoPath ? (
              <Image
                src={`${TMDB_IMAGE_BASE_URL}${provider.logoPath}`}
                alt={provider.watchProvider}
                width={160}
                height={48}
                className="h-10 w-auto max-w-24 rounded-xl object-contain object-left"
              />
            ) : (
              <span className="text-sm font-medium text-white/75">
                {provider.watchProvider}
              </span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
