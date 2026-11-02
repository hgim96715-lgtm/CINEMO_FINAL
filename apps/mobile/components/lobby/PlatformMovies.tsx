import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { getImageUrl } from "@/lib/utils";
import {
  MOBILE_PLATFORM_PROVIDERS,
  moviePlatformQueryOptions,
} from "@/lib/queries/movie-platform.query";
import { SectionHeader } from "@/components/lobby/SectionHeader";

type PlatformMovie = {
  movie: MovieSearchItemResponse;
  providers: Array<{
    label: string;
    logoPath: string | null;
  }>;
};

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

export function PlatformMovies() {
  const providerQueries = useQueries({
    queries: MOBILE_PLATFORM_PROVIDERS.map(({ provider }) =>
      moviePlatformQueryOptions(provider, { limit: 20 }),
    ),
  });

  const movies = new Map<string, PlatformMovie>();

  providerQueries.forEach((query) => {
    query.data?.items.forEach((movie) => {
      if (!movie.title || !movie.posterUrl) return;

      const providers = MOBILE_PLATFORM_PROVIDERS.filter(({ provider }) =>
        movie.watchOptions.some((option) => option.watchProvider === provider),
      ).map(({ provider, label }) => ({
        label,
        logoPath:
          movie.watchOptions.find(
            (option) => option.watchProvider === provider,
          )?.logoPath ?? null,
      }));
      if (providers.length === 0) return;

      const current = movies.get(movie.id);
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

      movies.set(movie.id, {
        movie,
        providers,
      });
    });
  });

  const items = Array.from(movies.values()).slice(0, 12);
  const isPending = providerQueries.every((query) => query.isPending);

  if (isPending || items.length === 0) return null;

  return (
    <View className="mt-8">
      <SectionHeader
        eyebrow="WATCH ANYWHERE"
        title="플랫폼에서 볼 수 있는 영화"
        morePath="/movies/platform"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 4 }}
      >
        {items.map(({ movie, providers }) => {
          const posterUrl = getImageUrl(movie.posterUrl);

          return (
            <Pressable
              key={movie.id}
              className="mr-4"
              style={{ width: 132 }}
              onPress={() => router.push(`/movies/${movie.id}`)}
            >
              <View
                className="relative overflow-hidden rounded-2xl"
                style={{
                  width: 132,
                  height: 198,
                  backgroundColor: CINEMO_COLORS.surface,
                }}
              >
                {posterUrl ? (
                  <Image
                    source={{ uri: posterUrl }}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                    accessibilityLabel={`${movie.title} 포스터`}
                  />
                ) : null}
                <View className="absolute inset-x-0 top-2 flex-row flex-wrap gap-1.5 px-2">
                  {providers.map((provider) =>
                    provider.logoPath ? (
                      <Image
                        key={provider.label}
                        source={{
                          uri: `${TMDB_IMAGE_BASE_URL}${provider.logoPath}`,
                        }}
                        resizeMode="contain"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          backgroundColor: "rgba(0,0,0,0.62)",
                        }}
                        accessibilityLabel={`${provider.label} 로고`}
                      />
                    ) : (
                      <View
                        key={provider.label}
                        className="rounded-lg bg-black/70 px-1.5 py-1"
                      >
                        <Text className="text-[8px] font-bold text-white">
                          {provider.label}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
              <Text
                numberOfLines={1}
                className="mt-3 text-sm font-medium"
                style={{ color: CINEMO_COLORS.textPrimary }}
              >
                {movie.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
