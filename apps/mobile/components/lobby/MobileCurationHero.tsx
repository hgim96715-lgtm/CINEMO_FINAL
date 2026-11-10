import { CachedImage as Image } from "@/components/common/CachedImage";
import { useQuery, useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import { CalendarDays, Shuffle } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { CINEMO_COLORS } from "@cinemo/shared";
import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";
import { moviePlatformQueryOptions, MOBILE_PLATFORM_PROVIDERS } from "@/lib/queries/movie-platform.query";
import { movieUpcomingQueryOptions } from "@/lib/queries/movie-upcoming.query";
import { getImageUrl } from "@/lib/utils";
import { PlatformLogo } from "@/components/common/PlatformLogo";

export type MobileHeroKind = "commemorative" | "upcoming" | "platform";

type MobileHeroMovie = {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  reason: string | null;
  providers: Array<{
    provider: string;
    label: string;
    logoPath: string | null;
  }>;
};

function isValidMovie(movie: { title?: string | null; posterUrl?: string | null }) {
  return Boolean(movie.title?.trim() && movie.posterUrl);
}

function toHeroMovie(movie: MovieSearchItemResponse): MobileHeroMovie {
  return {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.posterUrl,
    releaseDate: movie.releaseDate,
    reason: null,
    providers: [],
  };
}

type MobileCurationHeroProps = {
  kind: MobileHeroKind;
};

function PlatformLogoRow({
  providers,
}: {
  providers: MobileHeroMovie["providers"];
}) {
  const visibleProviders = providers.slice(0, 4);
  const remainingCount = providers.length - visibleProviders.length;

  return (
    <View className="mt-2 h-5 flex-row items-center gap-1">
      {visibleProviders.map((provider) => (
        <PlatformLogo
          key={provider.provider}
          provider={provider.provider}
          logoPath={provider.logoPath}
          size={18}
          accessibilityLabel={`${provider.label} 로고`}
        />
      ))}
      {remainingCount > 0 && (
        <View
          className="h-[18px] min-w-[18px] items-center justify-center rounded-full px-1"
          style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
        >
          <Text
            className="text-[10px] font-semibold"
            style={{ color: CINEMO_COLORS.textSecondary }}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export function MobileCurationHero({ kind }: MobileCurationHeroProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const curationsQuery = useQuery({
    ...activeCurationsQueryOptions(),
    enabled: kind === "commemorative",
  });
  const upcomingQuery = useQuery(
    movieUpcomingQueryOptions({
      page: 1,
      limit: 20,
      enabled: kind === "upcoming",
    }),
  );
  const platformQueries = useQueries({
    queries: MOBILE_PLATFORM_PROVIDERS.map(({ provider }) => ({
      ...moviePlatformQueryOptions(provider, {
        limit: 20,
        enabled: kind === "platform",
      }),
    })),
  });

  const curations = curationsQuery.data ?? [];
  const commemorativeMovies = useMemo(
    () => {
      const movieMap = new Map<string, MobileHeroMovie>();

      for (const curation of curations) {
        for (const movie of curation.movies) {
          if (!isValidMovie(movie)) continue;

          movieMap.set(movie.id, {
            id: movie.id,
            title: movie.title,
            posterUrl: movie.posterUrl,
            releaseDate: movie.releaseDate,
            reason: movie.reason ?? null,
            providers: [],
          });
        }
      }

      return Array.from(movieMap.values());
    },
    [curations],
  );
  const upcomingMovies = useMemo(
    () =>
      (upcomingQuery.data?.items ?? [])
        .filter(isValidMovie)
        .map(toHeroMovie),
    [upcomingQuery.data?.items],
  );
  const platformMovies = useMemo(() => {
    const movieMap = new Map<string, MobileHeroMovie>();

    platformQueries.forEach((query) => {
      query.data?.items.forEach((movie) => {
        if (!isValidMovie(movie)) return;

        const providers = MOBILE_PLATFORM_PROVIDERS.filter(({ provider }) =>
          movie.watchOptions.some((option) => option.watchProvider === provider),
        ).map(({ provider, label }) => ({
          provider,
          label,
          logoPath:
            movie.watchOptions.find(
              (option) => option.watchProvider === provider,
            )?.logoPath ?? null,
        }));

        const current = movieMap.get(movie.id);
        if (current) {
          for (const provider of providers) {
            if (
              !current.providers.some(
                (currentProvider) => currentProvider.label === provider.label,
              )
            ) {
              current.providers.push(provider);
            }
          }
          return;
        }

        movieMap.set(movie.id, {
          ...toHeroMovie(movie),
          providers,
        });
      });
    });

    return Array.from(movieMap.values());
  }, [platformQueries]);

  const movies =
    kind === "commemorative"
      ? commemorativeMovies
      : kind === "upcoming"
        ? upcomingMovies
        : platformMovies;
  const movieIds = movies.map((movie) => movie.id).join("|");

  useEffect(() => {
    setSelectedIndex((currentIndex) =>
      currentIndex < movies.length ? currentIndex : 0,
    );
  }, [movieIds]);

  const isPending =
    kind === "commemorative"
      ? curationsQuery.isPending
      : kind === "upcoming"
        ? upcomingQuery.isPending
        : platformQueries.some((query) => query.isPending);
  const movie = movies[selectedIndex] ?? movies[0];
  const selectedCuration = curations.find((curation) =>
    curation.movies.some((item) => item.id === movie?.id),
  );

  if (isPending) {
    return <View className="mx-5 mt-5 h-72 rounded-3xl bg-cinemo-surface" />;
  }

  if (!movie) return null;

  const posterUrl = getImageUrl(movie.posterUrl);
  const eyebrow =
    kind === "commemorative"
      ? selectedCuration?.eyebrow?.trim() || "CINEMO CURATION"
      : kind === "upcoming"
        ? "COMING SOON"
        : "WATCH ANYWHERE";
  const heading =
    kind === "commemorative"
      ? selectedCuration?.title?.trim() || null
      : kind === "upcoming"
        ? "개봉 예정작"
        : "플랫폼에서 볼 수 있는 영화";
  const curationDescription =
    kind === "commemorative"
      ? selectedCuration?.description?.trim() || null
      : null;

  return (
    <View className="mx-5 mt-5 overflow-hidden rounded-3xl border border-cinemo-gold/20 bg-cinemo-surface px-5 py-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold">
          {eyebrow}
        </Text>

        {movies.length > 1 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다른 영화 보기"
            onPress={() =>
              setSelectedIndex((currentIndex) =>
                (currentIndex + 1) % movies.length,
              )
            }
            className="h-9 w-9 items-center justify-center rounded-full border border-white/15"
          >
            <Shuffle size={16} color={CINEMO_COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      {heading && (
        <Text className="mt-3 text-2xl font-bold leading-8 text-cinemo-text">
          {heading}
        </Text>
      )}

      {curationDescription && (
        <Text
          numberOfLines={2}
          className="mt-3 text-sm leading-6 text-cinemo-muted"
        >
          {curationDescription}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${movie.title} 영화 상세 보기`}
        onPress={() => router.push(`/movies/${movie.id}`)}
        className="mt-6 flex-row gap-4"
      >
        <View className="w-[132px] shrink-0">
          {posterUrl ? (
            <Image
              source={{ uri: posterUrl }}
              resizeMode="cover"
              accessibilityLabel={`${movie.title} 포스터`}
              style={{
                width: 132,
                height: 198,
                borderRadius: 18,
                backgroundColor: CINEMO_COLORS.background,
                borderWidth: 1,
                borderColor: "rgba(199,161,75,0.35)",
              }}
            />
          ) : null}

          {kind === "platform" && movie.providers.length > 0 && (
            <PlatformLogoRow providers={movie.providers} />
          )}
        </View>

        <View className="min-w-0 flex-1 justify-center">
          <Text className="text-xl font-bold text-cinemo-text">
            {movie.title}
          </Text>

          {kind === "upcoming" && (
            <View className="mt-4 flex-row items-center gap-2">
              <CalendarDays size={16} color={CINEMO_COLORS.accentLight} />
              <Text className="text-sm text-cinemo-gold">
                {movie.releaseDate ?? "개봉일 미정"} 개봉 예정
              </Text>
            </View>
          )}

          {kind === "commemorative" && movie.reason && (
            <Text
              numberOfLines={4}
              className="mt-4 text-sm leading-6 text-cinemo-muted"
            >
              {movie.reason}
            </Text>
          )}

          {kind !== "commemorative" && (
            <Text className="mt-5 text-sm font-medium text-cinemo-gold">
              영화 자세히 보기  ↗
            </Text>
          )}
        </View>
      </Pressable>

    </View>
  );
}
