import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground, Pressable, Text, View } from "react-native";

type MovieHeroProps = {
  movie?: MovieSearchItemResponse;
  onTrailerPress?: () => void;
  onDetailPress?: () => void;
};

export function MovieHero({
  movie,
  onTrailerPress,
  onDetailPress,
}: MovieHeroProps) {
  if (!movie) return null;

  return (
    <ImageBackground
      source={{ uri: movie.posterUrl ?? undefined }}
      resizeMode="cover"
      style={{
        width: "100%",
        aspectRatio: 2 / 3,
      }}
      className="w-full overflow-hidden rounded-2xl "
    >
      <View className="flex-1 justify-end px-6 pb-8 pt-10">
        <Text className="text-xs font-semibold tracking-[4px]">
          CINEMO FEATURED MOVIE
        </Text>

        <Text className="mt-2 text-2xl font-bold">{movie.title}</Text>

        <Text className="mt-2 text-sm">
          {movie.genres.slice(0, 3).join(" · ")}
        </Text>

        <View className="mt-4 gap-2">
          {movie.hasTrailer ? (
            <Pressable
              className="relative h-11 w-full flex-row items-center justify-center gap-2 rounded-lg"
              onPress={onTrailerPress}
              style={{ backgroundColor: "blue" }}
            >
              <Ionicons name="play" size={15} />
              <Text className="font-semibold">예고편</Text>
            </Pressable>
          ) : null}

          <Pressable
            className="relative h-11 w-full items-center justify-center rounded-lg"
            onPress={onDetailPress}
            style={{ backgroundColor: "yellow" }}
          >
            <Text className="font-semibold">자세히 보기</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}
