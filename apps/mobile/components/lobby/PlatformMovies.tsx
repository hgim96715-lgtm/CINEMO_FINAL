import { CachedImage as Image } from "@/components/common/CachedImage";
import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, FlatList, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { getImageUrl } from "@/lib/utils";
import {
  MOBILE_PLATFORM_PROVIDERS,
  moviePlatformQueryOptions,
} from "@/lib/queries/movie-platform.query";
import { SectionHeader } from "@/components/lobby/SectionHeader";
import { PlatformLogo } from "@/components/common/PlatformLogo";
import { MovieCollectionSkeleton } from "./LobbySkeleton";

type PlatformMovie = {
  movie: MovieSearchItemResponse;
  providers: Array<{
    provider: string;
    label: string;
    logoPath: string | null;
  }>;
};

function PlatformLogoRow({
  providers,
}: {
  providers: PlatformMovie["providers"];
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
        provider,
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
  const isPending = providerQueries.some((query) => query.isPending);

  if (isPending) {
    return (
      <MovieCollectionSkeleton
        eyebrow="WATCH ANYWHERE"
        title="플랫폼에서 볼 수 있는 영화"
        cardWidth={132}
        cardHeight={198}
        showMeta
      />
    );
  }

  if (items.length === 0) return null;

  return (
    <View className="mt-8">
      <SectionHeader
        eyebrow="WATCH ANYWHERE"
        title="플랫폼에서 볼 수 있는 영화"
        morePath="/movies/platform"
      />

      <FlatList
        horizontal
        data={items}
        keyExtractor={({ movie }) => movie.id}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 4 }}
        renderItem={({ item: { movie, providers } }) => {
          const posterUrl = getImageUrl(movie.posterUrl);

          return (
            <Pressable
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
                  borderWidth: 1,
                  borderColor: "rgba(199,161,75,0.35)",
                }}
              >
                {posterUrl ? (
                  <Image
                    source={{ uri: posterUrl }}
                    imageWidth={132}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                    accessibilityLabel={`${movie.title} 포스터`}
                  />
                ) : null}
              </View>
              <PlatformLogoRow providers={providers} />
              <Text
                numberOfLines={1}
                className="mt-2 text-sm font-medium"
                style={{ color: CINEMO_COLORS.textPrimary }}
              >
                {movie.title}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
