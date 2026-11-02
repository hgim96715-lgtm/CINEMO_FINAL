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
  providers: string[];
};

export function PlatformMovies() {
  const providerQueries = useQueries({
    queries: MOBILE_PLATFORM_PROVIDERS.map(({ provider }) =>
      moviePlatformQueryOptions(provider),
    ),
  });

  const movies = new Map<string, PlatformMovie>();

  providerQueries.forEach((query) => {
    query.data?.items.forEach((movie) => {
      if (!movie.title || !movie.posterUrl) return;

      const provider = MOBILE_PLATFORM_PROVIDERS.find(({ provider: value }) =>
        movie.watchOptions.some((option) => option.watchProvider === value),
      );
      if (!provider) return;

      const current = movies.get(movie.id);
      if (current) {
        if (!current.providers.includes(provider.label)) {
          current.providers.push(provider.label);
        }
        return;
      }

      movies.set(movie.id, {
        movie,
        providers: [provider.label],
      });
    });
  });

  const items = Array.from(movies.values()).slice(0, 12);
  const isPending = providerQueries.every((query) => query.isPending);

  if (isPending || items.length === 0) return null;

  return (
    <View className="mt-8">
      <SectionHeader eyebrow="WATCH ANYWHERE" title="플랫폼에서 볼 수 있는 영화" />

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
                <View className="absolute inset-x-0 bottom-0 bg-black/75 px-2 py-2">
                  <Text numberOfLines={1} className="text-[10px] text-white">
                    {providers.join(" · ")}
                  </Text>
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
