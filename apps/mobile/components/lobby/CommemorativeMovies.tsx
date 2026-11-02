import { useQuery } from "@tanstack/react-query";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { CINEMO_COLORS } from "@cinemo/shared";
import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";
import { getImageUrl } from "@/lib/utils";
import { SectionHeader } from "@/components/lobby/SectionHeader";

export function CommemorativeMovies() {
  const curationsQuery = useQuery(activeCurationsQueryOptions());
  const movies = (curationsQuery.data?.[0]?.movies ?? [])
    .filter((movie) => Boolean(movie.title && movie.posterUrl))
    .slice(0, 10);

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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 4 }}
      >
        {movies.map((movie) => {
          const posterUrl = getImageUrl(movie.posterUrl);

          return (
            <Pressable
              key={movie.id}
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
        })}
      </ScrollView>
    </View>
  );
}
