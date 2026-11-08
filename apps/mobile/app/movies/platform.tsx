import { CachedImage as Image } from "@/components/common/CachedImage";
import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { CINEMO_COLORS } from "@cinemo/shared";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { MovieListHeader } from "@/components/movies/MovieListHeader";
import { PlatformLogo } from "@/components/common/PlatformLogo";
import {
  MOBILE_PLATFORM_PROVIDERS,
  moviePlatformQueryOptions,
} from "@/lib/queries/movie-platform.query";
import { getImageUrl } from "@/lib/utils";

const GRID_HORIZONTAL_PADDING = 32;
const GRID_GAP = 16;

type PlatformMovie = {
  movie: MovieSearchItemResponse;
  providers: Array<{
    provider: string;
    label: string;
    logoPath: string | null;
  }>;
};

export default function PlatformMoviesScreen() {
  const [filter, setFilter] = useState("ALL");
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth =
    (screenWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
  const providerQueries = useQueries({
    queries: MOBILE_PLATFORM_PROVIDERS.map(({ provider }) =>
      moviePlatformQueryOptions(provider, { limit: 100 }),
    ),
  });

  const movies = useMemo(() => {
    const movieMap = new Map<string, PlatformMovie>();

    providerQueries.forEach((query) => {
      query.data?.items.forEach((movie) => {
        if (!movie.title || !movie.posterUrl) return;

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

        if (providers.length === 0) return;

        const existing = movieMap.get(movie.id);
        if (existing) {
          for (const provider of providers) {
            if (
              !existing.providers.some(
                (existingProvider) =>
                  existingProvider.provider === provider.provider,
              )
            ) {
              existing.providers.push(provider);
            }
          }
          return;
        }

        movieMap.set(movie.id, { movie, providers });
      });
    });

    return Array.from(movieMap.values());
  }, [providerQueries]);

  const filteredMovies = useMemo(
    () =>
      filter === "ALL"
        ? movies
        : movies.filter(({ providers }) =>
            providers.some((provider) => provider.provider === filter),
          ),
    [filter, movies],
  );
  const isPending = providerQueries.some((query) => query.isPending);
  const isError = providerQueries.every((query) => query.isError);
  const filterOptions = [
    { value: "ALL", label: "전체" },
    ...MOBILE_PLATFORM_PROVIDERS.map(({ provider, label }) => ({
      value: provider,
      label,
    })),
  ];

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <CinemoBackground />

      <MovieListHeader
        eyebrow="WATCH ANYWHERE"
        title="플랫폼에서 볼 수 있는 영화"
        filter={filter}
        options={filterOptions}
        onFilterChange={setFilter}
      />

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={CINEMO_COLORS.accentLight} />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text style={{ color: CINEMO_COLORS.textPrimary }}>
            플랫폼 영화를 불러오지 못했습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMovies}
          numColumns={2}
          keyExtractor={({ movie }) => movie.id}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{
            gap: 32,
            paddingHorizontal: GRID_HORIZONTAL_PADDING,
            paddingTop: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-20">
              <Text style={{ color: CINEMO_COLORS.textSecondary }}>
                해당 플랫폼의 영화가 없습니다.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const posterUrl = getImageUrl(item.movie.posterUrl);

            return (
              <Pressable
                style={{ width: cardWidth }}
                onPress={() => router.push(`/movies/${item.movie.id}`)}
              >
                <View
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    width: cardWidth,
                    aspectRatio: 2 / 3,
                    backgroundColor: CINEMO_COLORS.surface,
                    borderWidth: 1,
                    borderColor: "rgba(199,161,75,0.35)",
                  }}
                >
                  {posterUrl ? (
                    <Image
                      source={{ uri: posterUrl }}
                      resizeMode="cover"
                      style={{ width: "100%", height: "100%" }}
                      accessibilityLabel={`${item.movie.title} 포스터`}
                    />
                  ) : null}

                </View>

                <View className="mt-2 flex-row flex-wrap gap-1.5 self-start">
                  {item.providers.map((provider) => (
                    <PlatformLogo
                      key={provider.provider}
                      provider={provider.provider}
                      logoPath={provider.logoPath}
                      size={30}
                      accessibilityLabel={`${provider.label} 로고`}
                    />
                  ))}
                </View>

                <Text
                  numberOfLines={1}
                  className="mt-3 text-base font-semibold"
                  style={{ color: CINEMO_COLORS.textPrimary }}
                >
                  {item.movie.title}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
