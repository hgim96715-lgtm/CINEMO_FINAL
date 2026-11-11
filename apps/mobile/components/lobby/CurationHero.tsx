import { CachedImage as Image } from "@/components/common/CachedImage";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import { activeCurationsQueryOptions } from "@/lib/queries/curation.query";
import { getImageUrl } from "@/lib/utils";
import { MobileCurationHeroSkeleton } from "./LobbySkeleton";

export function CurationHero() {
  const curationsQuery = useQuery(activeCurationsQueryOptions());
  const curation = curationsQuery.data?.[0];
  const movie = curation?.movies[0];

  if (curationsQuery.isPending) {
    return <MobileCurationHeroSkeleton />;
  }

  if (curationsQuery.isError || !curation || !movie) {
    return null;
  }

  const posterUrl = getImageUrl(movie.posterUrl);

  return (
    <View className="mx-5 mt-5 overflow-hidden rounded-3xl bg-cinemo-surface px-5 py-6">
      <Text className="text-xs font-semibold tracking-[3px] text-cinemo-gold">
        CINEMO CURATION
      </Text>

      <Text className="mt-3 text-sm font-medium text-cinemo-gold">
        {curation.eyebrow}
      </Text>

      <Text className="mt-2 text-2xl font-bold leading-8 text-cinemo-text">
        {curation.title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${movie.title} 영화 상세 보기`}
        onPress={() => router.push(`/movies/${movie.id}`)}
        className="mt-5 flex-row items-center gap-4"
      >
        {posterUrl ? (
          <Image
            source={{ uri: posterUrl }}
            resizeMode="cover"
            accessibilityLabel={`${movie.title} 포스터`}
            style={{
              width: 118,
              height: 177,
              borderRadius: 18,
              backgroundColor: CINEMO_COLORS.background,
            }}
          />
        ) : null}

        <View className="min-w-0 flex-1">
          <Text className="text-xl font-bold text-cinemo-text">
            {movie.title}
          </Text>
          <Text className="mt-3 text-sm leading-6 text-cinemo-muted">
            {movie.reason ?? curation.description}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
