import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MovieDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const movieId = Array.isArray(params.id) ? params.id[0] : params.id;

  const movieQuery = useQuery(movieDetailQueryOptions(movieId ?? ""));
  if (movieQuery.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (movieQuery.isError || !movieQuery.data) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-5">
        <Text>영화 정보를 불러오지 못했습니다.</Text>

        <Pressable
          className="mt-4 rounded-xl px-5 py-3"
          onPress={() => router.back()}
        >
          <Text>뒤로 가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const movie = movieQuery.data;

  const primaryTitle =
    movie.titles.find((title) => title.title === "PRIMARY") ?? movie.titles[0];
  const primaryRelease =
    movie.releases.find((release) => release.isPrimary) ?? movie.releases[0];
  const poster = movie.media.find(
    (media) => media.mediaType === "POSTER" && media.isPrimary,
  );
  const directors = movie.credits
    .filter((credit) => credit.creditType === "DIRECTOR")
    .map((credit) => credit.person.name);
  const actors = movie.credits
    .filter((credit) => credit.creditType === "ACTOR")
    .slice(0, 10)
    .map((credit) => credit.person.name);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row items-center px-5 py-4">
        <Pressable
          accessibilityLabel="뒤로 가기"
          className="h-12 w-12 items-center justify-center"
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} />
        </Pressable>

        <Text className="ml-2 text-lg font-semibold">영화 상세</Text>
      </View>

      <ScrollView
        contentContainerClassName="gap-6 px-5 pb-28"
        showsVerticalScrollIndicator={false}
      >
        {poster ? (
          <Image
            source={{ uri: poster.url }}
            resizeMode="cover"
            className="w-full rounded-2xl"
            style={{ aspectRatio: 2 / 3 }}
          />
        ) : (
          <View
            className="w-full items-center justify-center rounded-2xl"
            style={{ aspectRatio: 2 / 3 }}
          >
            <Text>포스터 없음</Text>
          </View>
        )}

        <View>
          <Text className="text-3xl font-bold">
            {primaryTitle?.title ?? "제목 없음"}
          </Text>

          {primaryRelease?.releaseDate && (
            <Text className="mt-3">개봉일 {primaryRelease.releaseDate}</Text>
          )}

          <View className="mt-4 flex-row flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <Text key={genre.id} className="rounded-lg px-3 py-1">
                {genre.name}
              </Text>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Text>감독: {directors.join(", ") || "정보 없음"}</Text>

          <Text>출연: {actors.join(", ") || "정보 없음"}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
