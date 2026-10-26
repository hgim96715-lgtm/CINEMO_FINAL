import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";

import { CINEMO_COLORS } from "@cinemo/shared";
import {
  deletePostcard,
  type Postcard,
  type PostcardMetadata,
} from "@/lib/api/postcards";
import {
  myPostcardsQueryOptions,
  postcardFeedQueryOptions,
} from "@/lib/queries/postcard-feed.query";
import { getImageUrl } from "@/lib/utils";

const postcardTypeLabels: Record<Postcard["type"], string> = {
  REVIEW: "감상",
  QUOTE: "인용",
  SCENE: "장면",
};

const panelStyle = {
  borderColor: "rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.035)",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(" ", "");
}

function getPostcardImage(postcard: Postcard) {
  return getImageUrl(postcard.media[0]?.url ?? postcard.movie?.posterUrl ?? null);
}

function PostcardContent({
  postcard,
  compact = false,
}: {
  postcard: Postcard;
  compact?: boolean;
}) {
  const metadata = postcard.metadata as PostcardMetadata | null;
  const translation =
    metadata?.type === "QUOTE"
      ? metadata.translations?.find(
          (item) => item.language.toLowerCase() === "ko",
        )?.content
      : null;

  if (postcard.type === "QUOTE") {
    return (
      <View>
        <Text
          numberOfLines={compact ? 3 : undefined}
          className="text-sm leading-6 text-cinemo-muted"
        >
          “{postcard.content}”
        </Text>
        {translation && (
          <Text
            numberOfLines={compact ? 2 : undefined}
            className="mt-2 border-t border-white/10 pt-2 text-xs leading-5 text-cinemo-muted"
          >
            {translation}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View>
      {postcard.type === "SCENE" && metadata?.sceneTime && (
        <Text className="mb-1 text-xs text-cinemo-muted">
          시점 {metadata.sceneTime}
        </Text>
      )}
      <Text
        numberOfLines={compact ? 3 : undefined}
        className="text-sm leading-6 text-cinemo-muted"
      >
        {postcard.content}
      </Text>
    </View>
  );
}

function PostcardViewSheet({
  postcard,
  onClose,
}: {
  postcard: Postcard | null;
  onClose: () => void;
}) {
  const imageUrl = postcard ? getPostcardImage(postcard) : null;
  const queryClient = useQueryClient();
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: (postcardId: string) => deletePostcard(postcardId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: myPostcardsQueryOptions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
      ]);
      setIsDeleteConfirmVisible(false);
      onClose();
    },
  });

  useEffect(() => {
    if (!postcard) {
      setIsDeleteConfirmVisible(false);
    }
  }, [postcard]);

  return (
    <Modal
      transparent
      visible={postcard !== null}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 items-center justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.68)" }}
        onPress={() => {
          if (!isDeleteConfirmVisible) onClose();
        }}
      >
        <View
          onStartShouldSetResponder={() => true}
          className="max-h-[85%] w-full overflow-hidden rounded-t-3xl border"
          style={{
            borderColor: "rgba(212,181,106,0.42)",
            backgroundColor: "#102022",
          }}
        >
          {postcard && (
            <ScrollView>
              <View className="flex-row items-start justify-between px-6 pb-5 pt-6">
                <View className="flex-1 pr-4">
                  <Text className="text-xl font-bold text-cinemo-gold-light">
                    {postcard.movie?.title ?? "내 엽서"}
                  </Text>
                  <Text className="mt-2 text-sm text-cinemo-muted">
                    {postcardTypeLabels[postcard.type]} · {formatDate(postcard.createdAt)} 작성
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="엽서 상세 닫기"
                  onPress={onClose}
                  className="-mr-2 -mt-2 rounded-full p-2"
                >
                  <Ionicons
                    name="close"
                    size={26}
                    color={CINEMO_COLORS.textSecondary}
                  />
                </Pressable>
              </View>

              <View className="border-t border-white/10 px-6 py-5">
                {imageUrl && (
                  <Image
                    source={{ uri: imageUrl }}
                    resizeMode="contain"
                    className="h-40 w-28 self-center rounded-xl bg-[#172322]"
                  />
                )}

                <Text className="mt-5 text-xs text-cinemo-gold">
                  {postcard.author?.nickname ?? "익명"}
                </Text>
                <View className="mt-3">
                  <PostcardContent postcard={postcard} />
                </View>
              </View>

              <View className="flex-row flex-wrap justify-end gap-2 border-t border-white/10 px-6 py-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="댓글 보기"
                  onPress={() => {
                    onClose();
                    router.push(`/postcards/${postcard.id}`);
                  }}
                  className="rounded-xl border border-white/15 px-4 py-3"
                >
                  <Text className="text-sm text-cinemo-muted">댓글 보기</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="엽서 수정하기"
                  onPress={() => {
                    onClose();
                    router.push(`/postcards/new?postcardId=${postcard.id}`);
                  }}
                  className="rounded-xl bg-cinemo-gold px-4 py-3"
                >
                  <Text className="text-sm font-semibold text-cinemo-bg">
                    수정하기
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="엽서 삭제"
                  disabled={deleteMutation.isPending}
                  onPress={() => setIsDeleteConfirmVisible(true)}
                  className="rounded-xl border border-red-300/30 px-4 py-3"
                  style={{ opacity: deleteMutation.isPending ? 0.5 : 1 }}
                >
                  <Text className="text-sm font-semibold text-red-200">
                    엽서 삭제
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>

        {isDeleteConfirmVisible && postcard && (
          <Pressable
            className="absolute inset-0 items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
            onPress={() => {
              if (!deleteMutation.isPending) setIsDeleteConfirmVisible(false);
            }}
          >
            <View
              onStartShouldSetResponder={() => true}
              className="w-full overflow-hidden rounded-3xl border"
              style={{
                borderColor: "rgba(212,181,106,0.42)",
                backgroundColor: "#102022",
              }}
            >
              <View className="items-center px-6 pb-6 pt-7">
                <Text className="text-center text-xl font-bold text-cinemo-gold-light">
                  엽서 삭제
                </Text>
                <Text className="mt-3 text-center text-sm leading-6 text-cinemo-muted">
                  이 엽서를 삭제할까요?
                  {"\n"}삭제 후에는 복구할 수 없습니다.
                </Text>
                {deleteMutation.isError && (
                  <Text className="mt-3 text-center text-xs text-red-300">
                    엽서를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.
                  </Text>
                )}
              </View>

              <View className="flex-row justify-end gap-3 border-t border-white/10 px-6 py-5">
                <Pressable
                  disabled={deleteMutation.isPending}
                  onPress={() => setIsDeleteConfirmVisible(false)}
                  className="rounded-xl border border-white/15 px-5 py-3"
                >
                  <Text className="font-semibold text-cinemo-muted">취소</Text>
                </Pressable>
                <Pressable
                  disabled={deleteMutation.isPending}
                  onPress={() => deleteMutation.mutate(postcard.id)}
                  className="rounded-xl bg-red-500/80 px-5 py-3"
                  style={{ opacity: deleteMutation.isPending ? 0.5 : 1 }}
                >
                  <Text className="font-semibold text-white">
                    {deleteMutation.isPending ? "삭제 중..." : "삭제"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      </Pressable>
    </Modal>
  );
}

export function MyPostcardsList() {
  const [selectedPostcard, setSelectedPostcard] = useState<Postcard | null>(
    null,
  );
  const postcardsQuery = useInfiniteQuery(myPostcardsQueryOptions());
  const postcards = postcardsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  if (postcardsQuery.isPending) {
    return <Text className="text-sm text-cinemo-muted">내 엽서를 불러오는 중...</Text>;
  }

  if (postcardsQuery.isError) {
    return <Text className="text-sm text-red-300">내 엽서를 불러오지 못했습니다.</Text>;
  }

  return (
    <>
      {postcards.length === 0 ? (
        <View className="items-center rounded-2xl border p-10" style={panelStyle}>
          <Ionicons name="mail-outline" size={30} color={CINEMO_COLORS.textSecondary} />
          <Text className="mt-3 text-center text-sm text-cinemo-muted">
            아직 만든 엽서가 없습니다.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="첫 엽서 만들기"
            onPress={() => router.push("/postcards/new")}
            className="mt-5 flex-row items-center gap-1 rounded-xl bg-cinemo-gold px-4 py-3"
          >
            <Plus size={17} color={CINEMO_COLORS.background} />
            <Text className="font-semibold text-cinemo-bg">첫 엽서 만들기</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-cinemo-text">내 엽서</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="엽서 만들기"
              onPress={() => router.push("/postcards/new")}
              className="flex-row items-center gap-1 rounded-full border border-cinemo-gold/50 px-3 py-2"
            >
              <Plus size={16} color={CINEMO_COLORS.accentLight} />
              <Text className="text-sm font-semibold text-cinemo-gold-light">
                엽서 만들기
              </Text>
            </Pressable>
          </View>
          {postcards.map((postcard) => {
            const imageUrl = getPostcardImage(postcard);

            return (
              <Pressable
                key={postcard.id}
                onPress={() => setSelectedPostcard(postcard)}
                className="flex-row overflow-hidden rounded-2xl border p-3"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                }}
              >
                <View
                  className="overflow-hidden rounded-xl"
                  style={{ width: 96, height: 128, backgroundColor: "#172322" }}
                >
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      resizeMode="cover"
                      style={{ width: 96, height: 128 }}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center px-2">
                      <Text className="text-center text-xs text-cinemo-muted">
                        포스터 없음
                      </Text>
                    </View>
                  )}
                </View>

                <View className="min-w-0 flex-1 pl-4">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-xs text-cinemo-gold">
                      {postcardTypeLabels[postcard.type]}
                    </Text>
                    <Text className="text-xs text-cinemo-muted">
                      {postcard.status === "DRAFT"
                        ? "임시저장"
                        : postcard.visibility === "PUBLIC"
                          ? "공개"
                          : "비공개"}
                    </Text>
                  </View>
                  <Text
                    numberOfLines={1}
                    className="mt-2 text-sm font-semibold text-cinemo-text"
                  >
                    {postcard.movie?.title ?? "영화 정보 없음"}
                  </Text>
                  <View className="mt-2">
                    <PostcardContent postcard={postcard} compact />
                  </View>
                </View>
              </Pressable>
            );
          })}

          {postcardsQuery.hasNextPage && (
            <Pressable
              disabled={postcardsQuery.isFetchingNextPage}
              onPress={() => postcardsQuery.fetchNextPage()}
              className="items-center rounded-xl border border-white/15 px-4 py-3"
              style={{ opacity: postcardsQuery.isFetchingNextPage ? 0.5 : 1 }}
            >
              <Text className="text-sm text-cinemo-muted">
                {postcardsQuery.isFetchingNextPage ? "불러오는 중..." : "더 보기"}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <PostcardViewSheet
        postcard={selectedPostcard}
        onClose={() => setSelectedPostcard(null)}
      />
    </>
  );
}
