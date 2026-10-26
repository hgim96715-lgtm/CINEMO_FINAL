import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Heart, MessageCircle, Share2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import { postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";
import { getImageUrl } from "@/lib/utils";

const postcardTypeLabels = {
  REVIEW: "감상",
  QUOTE: "인용",
  SCENE: "장면",
} as const;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(" ", "");
}

export default function PostcardsScreen() {
  const {
    data,
    isPending,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery(postcardFeedQueryOptions());
  const postcards = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <FlatList
        data={postcards}
        keyExtractor={(postcard) => postcard.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="px-5 pt-4">
            <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold">
              CINEMO COMMUNITY
            </Text>
            <Text className="mt-2 text-2xl font-bold text-cinemo-text">
              공개 엽서
            </Text>
            <Text className="mt-2 text-sm text-cinemo-muted">
              영화에 대한 기억과 감상을 함께 나누는 공간
            </Text>
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <View className="items-center py-14">
              <ActivityIndicator color="#D4B56A" />
              <Text className="mt-3 text-cinemo-muted">공개 엽서를 불러오는 중...</Text>
            </View>
          ) : isError ? (
            <View className="items-center px-5 py-14">
              <Text className="text-cinemo-muted">공개 엽서를 불러오지 못했습니다.</Text>
              <Pressable onPress={() => refetch()} className="mt-4 rounded-xl bg-cinemo-gold px-4 py-3">
                <Text className="font-semibold text-cinemo-bg">다시 시도</Text>
              </Pressable>
            </View>
          ) : (
            <Text className="px-5 py-14 text-center text-cinemo-muted">공개된 엽서가 없습니다.</Text>
          )
        }
        renderItem={({ item: postcard }) => {
          const imageUrl = getImageUrl(
            postcard.media[0]?.url ?? postcard.movie?.posterUrl,
          );

          return (
            <Pressable
              onPress={() => router.push(`/postcards/${postcard.id}`)}
              className="mx-5 mt-5 overflow-hidden rounded-3xl border border-white/15 p-4"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.07)" }}
            >
              <View className="flex-row gap-4">
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    resizeMode="cover"
                    className="h-32 w-24 rounded-2xl"
                  />
                ) : (
                  <View className="h-32 w-24 items-center justify-center rounded-2xl bg-cinemo-bg">
                    <Text className="text-center text-xs text-cinemo-muted">포스터 없음</Text>
                  </View>
                )}

                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-xs text-cinemo-muted">
                      {formatDate(postcard.createdAt)} · {postcard.author?.nickname ?? "익명"}
                    </Text>
                    <Text className="rounded-full bg-cinemo-gold px-2 py-1 text-xs font-semibold text-cinemo-bg">
                      {postcardTypeLabels[postcard.type]}
                    </Text>
                  </View>
                  <Text numberOfLines={1} className="mt-2 text-lg font-semibold text-cinemo-text">
                    {postcard.movie?.title ?? "영화 정보 없음"}
                  </Text>
                  {postcard.type === "QUOTE" ? (
                    <View className="mt-2">
                      <PostcardQuoteContent
                        content={postcard.content}
                        metadata={postcard.metadata}
                        compact
                      />
                    </View>
                  ) : (
                    <Text
                      numberOfLines={4}
                      className="mt-2 text-sm leading-6 text-cinemo-muted"
                    >
                      {postcard.content}
                    </Text>
                  )}
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-end gap-4 border-t border-white/10 pt-3">
                <View className="flex-row items-center gap-1">
                  <Heart
                    size={14}
                    color="#AEB8B8"
                    fill={postcard.hasReacted ? "#D4B56A" : "transparent"}
                  />
                  <Text className="text-xs text-cinemo-muted">
                    {postcard.reactionCount}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <MessageCircle size={14} color="#AEB8B8" />
                  <Text className="text-xs text-cinemo-muted">
                    {postcard.commentCount}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Share2 size={14} color="#AEB8B8" />
                  <Text className="text-xs text-cinemo-muted">
                    {postcard.shareCount}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.7}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="items-center py-5">
              <ActivityIndicator color="#D4B56A" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
