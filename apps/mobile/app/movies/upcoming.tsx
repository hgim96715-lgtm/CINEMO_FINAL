import { useQuery } from "@tanstack/react-query";
import { movieUpcomingQueryOptions } from "@/lib/queries/movie-upcoming.query";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { CINEMO_COLORS } from "@cinemo/shared";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getPosterUrl(url: string | null) {
  return url?.replace(/^http:\/\//i, "https://") ?? null;
}

function formatReleaseDate(releaseDate: string | null) {
  if (!releaseDate) return "개봉일 미정";

  const targetDate = new Date(`${releaseDate}T00:00:00`);
  const today = new Date();

  const todayDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const days = Math.round(
    (targetDate.getTime() - todayDate.getTime()) / DAY_IN_MS,
  );

  return `D-${days} · ${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`;
}

export default function UpcomingMoviesScreen() {
  const upcomingQuery = useQuery(
    movieUpcomingQueryOptions({ page: 1, limit: 100 }),
  );
  if (upcomingQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg">
        <ActivityIndicator color={CINEMO_COLORS.accentLight} />
      </SafeAreaView>
    );
  }
  if (upcomingQuery.isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cinemo-bg px-5">
        <Text style={{ color: CINEMO_COLORS.textPrimary }}>
          개봉 예정작을 불러오지 못했습니다.
        </Text>
        <Pressable
          className="mt-4 rounded-xl bg-cinemo-gold px-5 py-3"
          onPress={() => upcomingQuery.refetch()}
        >
          <Text className="font-semibold text-cinemo-bg">다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }
  const movies = [...upcomingQuery.data.items].sort((a, b) =>
    (a.releaseDate ?? "9999-12-31").localeCompare(
      b.releaseDate ?? "9999-12-31",
    ),
  );
  return (
    <SafeAreaView className="flex-1 bg-cinemo-bg">
      <CinemoBackground />

      <View className="flex-row items-center px-5 py-4">
        <Pressable
          accessibilityLabel="뒤로 가기"
          className="h-12 w-12 items-center justify-center"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={CINEMO_COLORS.textPrimary} />
        </Pressable>

        <View className="ml-2">
          <Text
            className="text-xs font-semibold tracking-[4px]"
            style={{ color: CINEMO_COLORS.accentLight }}
          >
            COMING SOON
          </Text>

          <Text
            className="mt-1 text-2xl font-bold"
            style={{ color: CINEMO_COLORS.textPrimary }}
          >
            개봉 예정작
          </Text>
        </View>
      </View>

      <FlatList
        data={movies}
        numColumns={2}
        keyExtractor={(movie) => movie.id}
        columnWrapperStyle={{
          gap: 16,
        }}
        contentContainerStyle={{
          gap: 24,
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Text style={{ color: CINEMO_COLORS.textSecondary }}>
              개봉 예정작이 없습니다.
            </Text>
          </View>
        }
        renderItem={({ item: movie }) => {
          const posterUrl = getPosterUrl(movie.posterUrl);

          return (
            <Pressable
              className="flex-1"
              style={{ minWidth: 0 }}
              onPress={() => router.push(`/movies/${movie.id}`)}
            >
              <View
                className="overflow-hidden rounded-2xl"
                style={{
                  width: "100%",
                  aspectRatio: 2 / 3,
                  backgroundColor: CINEMO_COLORS.surface,
                }}
              >
                {posterUrl ? (
                  <Image
                    source={{ uri: posterUrl }}
                    resizeMode="cover"
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    accessibilityLabel={`${movie.title} 포스터`}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text
                      className="text-xs"
                      style={{ color: CINEMO_COLORS.textSecondary }}
                    >
                      포스터 준비중
                    </Text>
                  </View>
                )}
              </View>

              <Text
                numberOfLines={1}
                className="mt-3 text-base font-semibold"
                style={{ color: CINEMO_COLORS.textPrimary }}
              >
                {movie.title}
              </Text>

              <Text
                className="mt-1 text-xs"
                style={{ color: CINEMO_COLORS.textSecondary }}
              >
                {formatReleaseDate(movie.releaseDate)}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
