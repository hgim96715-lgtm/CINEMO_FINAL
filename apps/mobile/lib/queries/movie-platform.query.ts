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

export const moviePlatformQueryOptions = (provider: ViewingPlatform) =>
  queryOptions({
    queryKey: ["movies", "platform", provider, 1, 8],
    queryFn: ({ signal }) => getMoviesByWatchProvider(provider, 1, 8, signal),
    staleTime: 5 * 60_000,
  });
