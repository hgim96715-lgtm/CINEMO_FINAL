import { queryOptions } from "@tanstack/react-query";

import {
  getMoviesByWatchProvider,
  type ViewingPlatform,
} from "@/lib/api/movies";

export const MOBILE_PLATFORM_PROVIDERS: Array<{
  provider: ViewingPlatform;
  label: string;
}> = [
  { provider: "NETFLIX", label: "Netflix" },
  { provider: "WATCHA", label: "Watcha" },
  { provider: "TVING", label: "TVING" },
  { provider: "DISNEY_PLUS", label: "Disney+" },
  { provider: "WAVVE", label: "Wavve" },
  { provider: "APPLE_TV", label: "Apple TV+" },
  { provider: "PRIME_VIDEO", label: "Prime Video" },
];

export const moviePlatformQueryOptions = (
  provider: ViewingPlatform,
  options: {
    page?: number;
    limit?: number;
    enabled?: boolean;
  } = {},
) => {
  const { page = 1, limit = 20, enabled = true } = options;

  return queryOptions({
    queryKey: ["movies", "platform", provider, page, limit],
    queryFn: ({ signal }) => getMoviesByWatchProvider(provider, page, limit, signal),
    enabled,
    staleTime: 5 * 60_000,
  });
};
