import { CachedImage as Image } from "@/components/common/CachedImage";
import { useQuery } from "@tanstack/react-query";
import { Pressable, FlatList, Text, View } from "react-native";
import { router } from "expo-router";

import { CINEMO_COLORS } from "@cinemo/shared";
import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";
import { getImageUrl } from "@/lib/utils";
import { SectionHeader } from "@/components/lobby/SectionHeader";

export function CommemorativeMovies() {
  const curationsQuery = useQuery(activeCurationsQueryOptions());
  const movies = Array.from(
    new Map(
      (curationsQuery.data ?? [])
        .flatMap((curation) => curation.movies)
        .filter((movie) => Boolean(movie.title && movie.posterUrl))
        .map((movie) => [movie.id, movie]),
    ).values(),
  );

  if (curationsQuery.isPending || curationsQuery.isError || movies.length === 0) {
    return null;
  }

  return (
    <View className="mt-6">
      <SectionHeader
        eyebrow="ANNIVERSARY"
        title="기념일"
        morePath="/movies/commemorative"
      />

      <FlatList
        horizontal
        data={movies}
        keyExtractor={(movie) => movie.id}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 4 }}
        renderItem={({ item: movie }) => {
          const posterUrl = getImageUrl(movie.posterUrl);

          return (
            <Pressable
              className="mr-4"
              style={{ width: 112 }}
              onPress={() => router.push(`/movies/${movie.id}`)}
            >
              <View
                className="overflow-hidden rounded-2xl"
                style={{
                  width: 112,
                  height: 168,
                  backgroundColor: CINEMO_COLORS.surface,
                }}
              >
                {posterUrl ? (
                  <Image
                    source={{ uri: posterUrl }}
                    imageWidth={112}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                    accessibilityLabel={`${movie.title} 포스터`}
                  />
                ) : null}
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
        }}
      />
    </View>
  );
}
