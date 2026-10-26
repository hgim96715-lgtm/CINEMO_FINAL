import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Heart,
  MessageCircle,
  Send,
  Share2,
  UserRound,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CINEMO_COLORS } from "@cinemo/shared";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import { getRefreshToken } from "@/lib/api/auth";
import type { PostcardComment } from "@/lib/api/postcard-comments";
import { createPostcardComment } from "@/lib/api/postcard-comments";
import { setPostcardHeart, sharePostcard } from "@/lib/api/postcards";
import { postcardCommentsQueryOptions } from "@/lib/queries/postcard-comment.query";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
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

function formatCommentDate(value: string) {
  const date = new Date(value);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function getCommentAuthor(comment: PostcardComment) {
  const author = comment.author;

  if (!author || typeof author !== "object") {
    return "익명";
  }

  const nickname = author.nickname;
  return typeof nickname === "string" && nickname.length > 0
    ? nickname
    : "익명";
}

function getCommentProfileImageUrl(comment: PostcardComment) {
  const author = comment.author;

  if (!author || typeof author !== "object") {
    return null;
  }

  const profileImageUrl = (author as { profileImageUrl?: unknown })
    .profileImageUrl;

  return typeof profileImageUrl === "string"
    ? getImageUrl(profileImageUrl)
    : null;
}

export default function PostcardDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const postcardId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [comment, setComment] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [isReacted, setIsReacted] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const postcardQuery = useQuery(postcardDetailQueryOptions(postcardId ?? ""));
  const commentsQuery = useInfiniteQuery(
    postcardCommentsQueryOptions(postcardId ?? ""),
  );
  const commentMutation = useMutation({
    mutationFn: () =>
      createPostcardComment(postcardId ?? "", { content: comment.trim() }),
    onSuccess: async () => {
      setComment("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: postcardCommentsQueryOptions(postcardId ?? "").queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardDetailQueryOptions(postcardId ?? "").queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
      ]);
    },
  });
  const heartMutation = useMutation({
    mutationFn: (previousReacted: boolean) =>
      setPostcardHeart(postcardId ?? "", previousReacted),
    onSuccess: async (data) => {
      setIsReacted(data.reacted);
      setReactionCount(data.reactionCount);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: postcardDetailQueryOptions(postcardId ?? "").queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: postcardFeedQueryOptions().queryKey,
        }),
      ]);
    },
  });
  const shareMutation = useMutation({
    mutationFn: (channel: string) => sharePostcard(postcardId ?? "", channel),
    onSuccess: (data) => {
      setShareCount(data.shareCount);
    },
  });

  useEffect(() => {
    getRefreshToken()
      .then((token) => setHasSession(Boolean(token)))
      .catch(() => setHasSession(false));
  }, []);

  useEffect(() => {
    const postcard = postcardQuery.data;

    if (!postcard) return;

    setIsReacted(postcard.hasReacted);
    setReactionCount(postcard.reactionCount);
    setShareCount(postcard.shareCount);
  }, [postcardQuery.data]);

  const comments =
    commentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const orderedComments = useMemo(() => {
    const commentsByParent = new Map<string | null, PostcardComment[]>();

    for (const item of comments) {
      const siblings = commentsByParent.get(item.parentId) ?? [];
      siblings.push(item);
      commentsByParent.set(item.parentId, siblings);
    }

    const ordered: PostcardComment[] = [];
    const visited = new Set<string>();

    const appendThread = (parentId: string | null) => {
      for (const item of commentsByParent.get(parentId) ?? []) {
        if (visited.has(item.id)) continue;

        visited.add(item.id);
        ordered.push(item);
        appendThread(item.id);
      }
    };

    appendThread(null);

    // 부모 댓글이 다른 페이지에 있어도 답글이 사라지지 않도록 마지막에 보존
    for (const item of comments) {
      if (!visited.has(item.id)) {
        visited.add(item.id);
        ordered.push(item);
      }
    }

    return ordered;
  }, [comments]);

  if (postcardQuery.isPending) {
    return (
      <SafeAreaView
        edges={[]}
        className="flex-1 items-center justify-center bg-cinemo-bg"
      >
        <ActivityIndicator color={CINEMO_COLORS.accentLight} />
      </SafeAreaView>
    );
  }

  if (postcardQuery.isError || !postcardQuery.data) {
    return (
      <SafeAreaView
        edges={[]}
        className="flex-1 items-center justify-center bg-cinemo-bg px-5"
      >
        <Text className="text-cinemo-muted">엽서를 불러오지 못했습니다.</Text>
        <Pressable
          onPress={() => router.replace("/postcards")}
          className="mt-4 rounded-xl bg-cinemo-gold px-5 py-3"
        >
          <Text className="font-semibold text-cinemo-bg">
            공개 엽서로 돌아가기
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const postcard = postcardQuery.data;
  const imageUrl = getImageUrl(
    postcard.movie?.posterUrl ?? postcard.media[0]?.url,
  );
  const sceneImageUrl =
    postcard.type === "SCENE"
      ? getImageUrl(postcard.media[0]?.url ?? null)
      : null;

  const submitComment = () => {
    if (!comment.trim() || commentMutation.isPending || !hasSession) return;
    commentMutation.mutate();
  };

  const toggleHeart = () => {
    if (heartMutation.isPending) return;

    if (!hasSession) {
      router.push("/login");
      return;
    }

    const previousReacted = isReacted;
    setIsReacted(!previousReacted);
    setReactionCount((count) => count + (previousReacted ? -1 : 1));
    heartMutation.mutate(previousReacted, {
      onError: () => {
        setIsReacted(previousReacted);
        setReactionCount((count) => count + (previousReacted ? 1 : -1));
      },
    });
  };

  const shareCurrentPostcard = async () => {
    if (shareMutation.isPending) return;

    const title = postcardQuery.data?.movie?.title ?? "CINEMO 엽서";
    const url = `https://www.cinemo.site/lobby/postcards/${postcardId}`;

    try {
      const result = await Share.share({
        title,
        message: `${title}\n${url}`,
        url,
      });

      if (result.action === Share.sharedAction) {
        await shareMutation.mutateAsync("native");
      }
    } catch {
      // 사용자가 공유 창을 닫은 경우에는 오류를 표시하지 않음
    }
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={8}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingBottom: 220 }}
        >
          <View className="px-5 pt-4">
            <View className="mb-6">
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

            <View
              className="overflow-hidden rounded-3xl border border-white/15 p-5"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.07)" }}
            >
              <View className="flex-row items-start justify-between gap-4">
                <View className="min-w-0 flex-1">
                  <Text className="text-xs tracking-[3px] text-cinemo-gold-light">
                    CINEMO POSTCARD
                  </Text>
                  <Text className="mt-2 text-xl font-semibold text-cinemo-text">
                    {postcard.movie?.title ?? "영화와 함께 남긴 기록"}
                  </Text>
                </View>

                {imageUrl && (
                  <Image
                    source={{ uri: imageUrl }}
                    resizeMode="contain"
                    className="h-24 w-16 rounded-xl"
                  />
                )}
              </View>

              <View className="mt-5 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-cinemo-gold">
                  {postcardTypeLabels[postcard.type]}
                </Text>
                <Text className="text-xs text-cinemo-muted">
                  {postcard.author?.nickname ?? "익명"} ·{" "}
                  {formatDate(postcard.createdAt)}
                </Text>
              </View>

              {sceneImageUrl && (
                <Image
                  source={{ uri: sceneImageUrl }}
                  resizeMode="contain"
                  accessibilityLabel={`${postcard.movie?.title ?? "영화"} 장면 이미지`}
                  className="mt-5 h-56 w-full rounded-2xl bg-cinemo-bg"
                />
              )}

              {postcard.type === "QUOTE" ? (
                <View className="mt-5">
                  <PostcardQuoteContent
                    content={postcard.content}
                    metadata={postcard.metadata}
                  />
                </View>
              ) : (
                <Text className="mt-5 text-xl font-semibold leading-8 text-cinemo-text">
                  {postcard.type === "SCENE"
                    ? `“${postcard.content}”`
                    : postcard.content}
                </Text>
              )}

              <View className="mt-6 flex-row items-center gap-5 border-t border-white/10 pt-4">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isReacted ? "하트 반응 취소" : "하트 반응"
                  }
                  onPress={toggleHeart}
                  disabled={heartMutation.isPending}
                  className="flex-row items-center gap-1"
                  style={{ opacity: !hasSession ? 0.7 : 1 }}
                >
                  <Heart
                    size={17}
                    color={
                      isReacted
                        ? CINEMO_COLORS.accentLight
                        : CINEMO_COLORS.textSecondary
                    }
                    fill={isReacted ? CINEMO_COLORS.accentLight : "transparent"}
                  />
                  <Text className="text-sm text-cinemo-muted">
                    {reactionCount}
                  </Text>
                </Pressable>
                <View className="flex-row items-center gap-1">
                  <MessageCircle
                    size={17}
                    color={CINEMO_COLORS.textSecondary}
                  />
                  <Text className="text-sm text-cinemo-muted">
                    {comments.length || postcard.commentCount}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="엽서 공유"
                  onPress={() => void shareCurrentPostcard()}
                  disabled={shareMutation.isPending}
                  className="flex-row items-center gap-1"
                >
                  <Share2 size={17} color={CINEMO_COLORS.textSecondary} />
                  <Text className="text-sm text-cinemo-muted">
                    {shareCount}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View className="mt-8">
              <Text className="text-xl font-semibold text-cinemo-text">
                댓글 {comments.length || postcard.commentCount}
              </Text>

              {hasSession ? (
                <View className="mt-4 flex-row items-center gap-2 rounded-2xl border border-white/15 bg-cinemo-surface p-3">
                  <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="댓글을 남겨보세요"
                    placeholderTextColor={CINEMO_COLORS.textSecondary}
                    multiline
                    returnKeyType="done"
                    textAlignVertical="center"
                    style={{ paddingTop: 8, paddingBottom: 0 }}
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    className="min-h-10 flex-1 px-1 text-cinemo-text"
                  />
                  <Pressable
                    accessibilityLabel="댓글 등록"
                    onPress={submitComment}
                    disabled={!comment.trim() || commentMutation.isPending}
                    className="h-10 w-10 items-center justify-center rounded-xl bg-cinemo-gold"
                    style={{
                      opacity:
                        !comment.trim() || commentMutation.isPending ? 0.45 : 1,
                    }}
                  >
                    <Send size={17} color={CINEMO_COLORS.background} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => router.push("/login")}
                  className="mt-4 rounded-2xl border border-white/15 bg-cinemo-surface px-4 py-4"
                >
                  <Text className="text-center text-sm text-cinemo-muted">
                    로그인 후 댓글을 남길 수 있습니다.
                  </Text>
                </Pressable>
              )}

              {commentsQuery.isPending ? (
                <ActivityIndicator
                  color={CINEMO_COLORS.accentLight}
                  className="mt-8"
                />
              ) : comments.length > 0 ? (
                <View className="mt-4 gap-3">
                  {orderedComments.map((item) => (
                    <View
                      key={item.id}
                      className={`flex-row gap-3 ${item.parentId ? "ml-5 border-l border-cinemo-gold/35 pl-4" : ""}`}
                    >
                      <View className="h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                        {getCommentProfileImageUrl(item) ? (
                          <Image
                            source={{
                              uri:
                                getCommentProfileImageUrl(item) ?? undefined,
                            }}
                            resizeMode="cover"
                            className="h-8 w-8"
                          />
                        ) : (
                          <UserRound
                            size={16}
                            color={CINEMO_COLORS.accentLight}
                          />
                        )}
                      </View>

                      <View className="min-w-0 flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="font-semibold text-cinemo-text">
                            {getCommentAuthor(item)}
                          </Text>
                          <Text className="text-xs text-cinemo-muted">
                            {formatCommentDate(item.createdAt)}
                          </Text>
                        </View>
                        <Text className="mt-2 leading-6 text-cinemo-muted">
                          {item.content}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="mt-8 text-center text-sm text-cinemo-muted">
                  아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
                </Text>
              )}

              {commentsQuery.hasNextPage && (
                <Pressable
                  onPress={() => void commentsQuery.fetchNextPage()}
                  className="mt-4 items-center rounded-xl border border-white/15 py-3"
                >
                  <Text className="text-sm text-cinemo-gold-light">
                    댓글 더보기
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
