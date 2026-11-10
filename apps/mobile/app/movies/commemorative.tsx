import { CachedImage as Image } from "@/components/common/CachedImage";
import { useQuery } from "@tanstack/react-query";
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

import { CINEMO_COLORS } from "@cinemo/shared";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";
import { getImageUrl } from "@/lib/utils";

const GRID_HORIZONTAL_PADDING = 32;
const GRID_GAP = 16;

export default function CommemorativeMoviesScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth =
    (screenWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP) / 2;
  const curationsQuery = useQuery(activeCurationsQueryOptions());
  const curations = curationsQuery.data ?? [];
  const curationDescription =
    curations.length === 1 ? curations[0]?.description?.trim() || null : null;
  const movies = Array.from(
    new Map(
      curations
        .flatMap((curation) => curation.movies)
        .filter((movie) => Boolean(movie.title && movie.posterUrl))
        .map((movie) => [movie.id, movie]),
    ).values(),
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <CinemoBackground />
      <View className="mb-6 px-5">
        <Text
          className="text-xs font-semibold tracking-[4px]"
          style={{ color: CINEMO_COLORS.accentLight }}
        >
          ANNIVERSARY
        </Text>
        <Text
          className="mt-2 text-3xl font-semibold"
          style={{ color: CINEMO_COLORS.textPrimary }}
        >
          기념일
        </Text>
        {curationDescription && (
          <Text
            className="mt-3 text-sm leading-6"
            style={{ color: CINEMO_COLORS.textSecondary }}
          >
            {curationDescription}
          </Text>
        )}
      </View>

      {curationsQuery.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={CINEMO_COLORS.accentLight} />
        </View>
      ) : curationsQuery.isError ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text style={{ color: CINEMO_COLORS.textPrimary }}>
            기념일 영화를 불러오지 못했습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          numColumns={2}
          keyExtractor={(movie) => movie.id}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{
            gap: 32,
            paddingHorizontal: GRID_HORIZONTAL_PADDING,
            paddingTop: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: movie }) => (
            <Pressable
              style={{ width: cardWidth }}
              onPress={() => router.push(`/movies/${movie.id}`)}
            >
              <View
                className="overflow-hidden rounded-2xl"
                style={{
                  width: cardWidth,
                  aspectRatio: 2 / 3,
                  backgroundColor: CINEMO_COLORS.surface,
                }}
              >
                <Image
                  source={{ uri: getImageUrl(movie.posterUrl)! }}
                  resizeMode="cover"
                  style={{ width: "100%", height: "100%" }}
                  accessibilityLabel={`${movie.title} 포스터`}
                />
              </View>
              <Text
                numberOfLines={1}
                className="mt-3 text-sm font-medium"
                style={{ color: CINEMO_COLORS.textPrimary }}
              >
                {movie.title}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text className="py-20 text-center text-cinemo-muted">
              등록된 기념일 영화가 없습니다.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
