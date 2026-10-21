import { useQuery } from "@tanstack/react-query";
import { CINEMO_COLORS } from "@cinemo/shared";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { movieRankingQueryOptions } from "@/lib/queries/movie-ranking.query";

import { MovieCard } from "./MovieCard";

export function MovieRanking() {
  const rankingQuery = useQuery(
    movieRankingQueryOptions({
      page: 1,
      limit: 10,
    }),
  );

  if (rankingQuery.isPending) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator color={CINEMO_COLORS.accent} />
      </View>
    );
  }

  if (rankingQuery.isError) {
    return (
      <View className="items-center px-5 py-8">
        <Text style={{ color: CINEMO_COLORS.textPrimary }}>
          영화 순위를 불러오지 못했습니다.
        </Text>
      </View>
    );
  }

  const movies = rankingQuery.data.items;

  return (
    <View>
      <View className="px-5 pt-8">
        <Text
          className="text-xs font-semibold tracking-[4px]"
          style={{ color: CINEMO_COLORS.accentLight }}
        >
          CINEMO RANKING
        </Text>

        <Text
          className="mt-2 text-2xl font-bold"
          style={{ color: CINEMO_COLORS.textPrimary }}
        >
          오늘의 영화 순위
        </Text>

        <Text
          className="mt-2 text-sm"
          style={{ color: CINEMO_COLORS.textSecondary }}
        >
          KOBIS 박스오피스
        </Text>
      </View>

      {movies.length === 0 ? (
        <View className="px-5 pt-8">
          <Text style={{ color: CINEMO_COLORS.textSecondary }}>
            현재 표시할 영화 순위가 없습니다.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          className="mt-6"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: 20,
            paddingRight: 4,
          }}
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              index={index}
              onPress={() => {
                router.push(`/movies/${movie.id}`);
              }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
