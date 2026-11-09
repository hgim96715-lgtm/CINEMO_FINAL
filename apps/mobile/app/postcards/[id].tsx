import { isAxiosError } from "axios";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  Ban,
  Check,
  Ellipsis,
  Heart,
  Flag,
  MessageCircle,
  Pencil,
  Send,
  Share2,
  Trash2,
  UserRound,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Image,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { CINEMO_COLORS } from "@cinemo/shared";
import { PostcardQuoteContent } from "@/components/postcard/PostcardQuoteContent";
import { blockPostcardAuthor, deletePostcard, reportPostcard } from "@/lib/api/postcards";
import { getRefreshToken } from "@/lib/api/auth";
import { deletePostcardComment, reportPostcardComment, updatePostcardComment, type PostcardComment } from "@/lib/api/postcard-comments";
import { postcardCommentsQueryOptions } from "@/lib/queries/postcard-comment.query";
import { useCreatePostcardComment } from "@/lib/queries/postcard-comment.mutation";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
import {
  useSetPostcardHeart,
  useSharePostcard,
} from "@/lib/queries/postcard.mutation";
import { currentUserQueryOptions } from "@/lib/queries/my-cinema.query";
import { myPostcardsQueryOptions, postcardFeedQueryOptions } from "@/lib/queries/postcard-feed.query";
import { getImageUrl } from "@/lib/utils";

function commentErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error) &&
      error.response?.status === 400 && typeof error.response.data.message === "string") {
    return error.response.data.message;
  }
  return "잠시 후 다시 시도해 주세요.";
}

type ActionSheet = {
  title: string;
  message?: string;
  actions?: {
    label: string;
    icon?: typeof Pencil;
    danger?: boolean;
    onPress: () => void;
  }[];
};

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
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [sheet, setSheet] = useState<ActionSheet | null>(null);
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);
  const { bottom } = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const shareInFlight = useRef(false);

  const composeInputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);

  function revealCommentInput() {
    const input = editInputRef.current?.isFocused() ? editInputRef.current : composeInputRef.current;
    if (!input?.isFocused()) return;
    const handle = input ? findNodeHandle(input) : null;
    if (handle !== null) {
      scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard(handle, 82, true);
    }
  }

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", revealCommentInput);
    return () => subscription.remove();
  }, []);

  const postcardQuery = useQuery(postcardDetailQueryOptions(postcardId ?? ""));
  const commentsQuery = useInfiniteQuery(
    postcardCommentsQueryOptions(postcardId ?? ""),
  );
  const commentMutation = useCreatePostcardComment();
  const heartMutation = useSetPostcardHeart(postcardId ?? "");
  const reportMutation = useMutation({
    mutationFn: (reason: string) => reportPostcard(postcardId ?? "", reason),
    onSuccess: () => setSheet({ title: "신고 접수", message: "운영팀 검토를 위해 신고가 접수되었어요." }),
    onError: () => setSheet({ title: "신고 접수 실패", message: "잠시 후 다시 시도해 주세요." }),
  });
  const queryClient = useQueryClient();
  const viewerQuery = useQuery({ ...currentUserQueryOptions(), enabled: hasSession });
  const blockAuthor = useMutation({
    mutationFn: (commentId?: string) => blockPostcardAuthor(postcardId ?? "", commentId),
    onSuccess: (_, commentId) => {
      if (!commentId) router.replace("/postcards");
      void queryClient.invalidateQueries({ queryKey: ["postcards"] });
      if (commentId) setSheet({ title: "차단 완료", message: "설정·지원에서 차단을 해제할 수 있어요." });
    },
    onError: () => setSheet({ title: "차단 실패", message: "잠시 후 다시 시도해 주세요." }),
  });
  const commentDelete = useMutation({
    mutationFn: (commentId: string) => deletePostcardComment(postcardId ?? "", commentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: postcardCommentsQueryOptions(postcardId ?? "").queryKey }),
        queryClient.invalidateQueries({ queryKey: postcardDetailQueryOptions(postcardId ?? "").queryKey }),
        queryClient.invalidateQueries({ queryKey: postcardFeedQueryOptions().queryKey }),
      ]);
    },
    onError: () => setSheet({ title: "댓글 삭제 실패", message: "잠시 후 다시 시도해 주세요." }),
  });
  const commentReport = useMutation({
    mutationFn: ({ commentId, reason }: { commentId: string; reason: string }) =>
      reportPostcardComment(postcardId ?? "", commentId, reason),
    onSuccess: () => setSheet({ title: "신고 접수", message: "댓글 신고가 접수되었어요." }),
    onError: () => setSheet({ title: "신고 접수 실패", message: "잠시 후 다시 시도해 주세요." }),
  });
  const commentUpdate = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updatePostcardComment(postcardId ?? "", id, content.trim()),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        postcardCommentsQueryOptions(postcardId ?? "").queryKey,
        (data) => data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => item.id === updated.id ? updated : item),
          })),
        },
      );
      setEditing(null);
    },
  });
  const postcardDelete = useMutation({
    mutationFn: () => deletePostcard(postcardId ?? ""),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: postcardFeedQueryOptions().queryKey });
      void queryClient.invalidateQueries({ queryKey: myPostcardsQueryOptions().queryKey });
      router.replace("/postcards");
    },
    onError: () => setSheet({ title: "엽서 삭제 실패", message: "잠시 후 다시 시도해 주세요." }),
  });
  const shareMutation = useSharePostcard(postcardId ?? "");

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
  const isOwnPostcard = hasSession && postcard.isMine === true;

  function openActions(item?: PostcardComment) {
    if (!hasSession) {
      setLoginModalVisible(true);
      return;
    }

    const label = item ? "댓글" : "엽서";
    const isMine = item ? item.author?.id === viewerQuery.data?.id : isOwnPostcard;

    if (isMine) {
      setSheet({
        title: `${label} 관리`,
        actions: [
          {
            label: "수정",
            icon: Pencil,
            onPress: () => {
              if (item) {
                commentUpdate.reset();
                setEditing({ id: item.id, content: item.content });
              } else {
                router.push({ pathname: "/postcards/new", params: { postcardId: postcard.id } });
              }
            },
          },
          {
            label: "삭제",
            icon: Trash2,
            danger: true,
            onPress: () => setSheet({
              title: `${label} 삭제`,
              message: `이 ${label}을 삭제할까요?`,
              actions: [{
                label: "삭제하기",
                icon: Trash2,
                danger: true,
                onPress: () => item ? commentDelete.mutate(item.id) : postcardDelete.mutate(),
              }],
            }),
          },
        ],
      });
      return;
    }

    setSheet({
      title: `${label} 더보기`,
      actions: [{
        label: "신고",
        icon: Flag,
        onPress: () => setSheet({
          title: `${label} 신고`,
          message: "신고 사유를 선택하면 접수돼요.",
          actions: ["스팸·광고", "부적절한 콘텐츠"].map((reason) => ({
            label: reason,
            onPress: () => item
              ? commentReport.mutate({ commentId: item.id, reason })
              : reportMutation.mutate(reason),
          })),
        }),
      }, {
        label: "작성자 차단",
        icon: Ban,
        danger: true,
        onPress: () => setSheet({
          title: "작성자 차단",
          message: "이 작성자의 엽서와 댓글이 보이지 않아요. 설정·지원에서 차단을 해제할 수 있어요.",
          actions: [{
            label: "차단하기",
            icon: Ban,
            danger: true,
            onPress: () => blockAuthor.mutate(item?.id),
          }],
        }),
      }],
    });
  }

  const imageUrl = getImageUrl(
    postcard.movie?.posterUrl ?? postcard.media[0]?.url,
  );
  const sceneImageUrl =
    postcard.type === "SCENE"
      ? getImageUrl(postcard.media[0]?.url ?? null)
      : null;

  const submitComment = () => {
    if (!comment.trim() || commentMutation.isPending || !hasSession) return;

    commentMutation.mutate(
      {
        postcardId: postcardId ?? "",
        content: comment.trim(),
      },
      {
        onSuccess: () => {
          setComment("");
        },
        onError: (error) => setSheet({
          title: "댓글을 등록하지 못했어요",
          message: commentErrorMessage(error),
        }),
      },
    );
  };

  const toggleHeart = () => {
    if (heartMutation.isPending) return;

    if (!hasSession) {
      setLoginModalVisible(true);
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
    if (shareInFlight.current || postcardQuery.data?.visibility !== "PUBLIC") return;
    shareInFlight.current = true;

    const title = postcardQuery.data?.movie?.title ?? "CINEMO 엽서";
    const url = `https://www.cinemo.site/lobby/postcards/${postcardId}`;

    try {
      const result = await Share.share(Platform.OS === "ios" ? { url } : { title, message: url });

      if (result.action === Share.sharedAction) {
        const data = await shareMutation.mutateAsync("native");
        setShareCount(data.shareCount);
      }
    } catch {
      // 공유 창이 닫히거나 집계 요청이 실패해도 화면을 유지한다.
    } finally {
      shareInFlight.current = false;
    }
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <Modal
          visible={loginModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setLoginModalVisible(false)}
        >
          <View className="flex-1 items-center justify-center bg-black/60 px-6">
            <View
              className="w-full max-w-sm rounded-3xl border p-6"
              style={{
                backgroundColor: "#102326",
                borderColor: "rgba(212,181,106,0.25)",
              }}
            >
              <Text className="text-center text-base font-semibold text-cinemo-gold-light">
                로그인 후 이용 가능합니다.
              </Text>

              <Text className="mt-3 text-center leading-6 text-cinemo-muted">
                로그인하시겠습니까?
              </Text>

              <View className="mt-6 flex-row justify-center gap-3">
                <Pressable
                  onPress={() => setLoginModalVisible(false)}
                  className="rounded-xl border border-white/15 px-4 py-3"
                >
                  <Text className="text-sm text-cinemo-muted">취소</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setLoginModalVisible(false);
                    router.push("/login");
                  }}
                  className="rounded-xl bg-cinemo-gold px-4 py-3"
                >
                  <Text className="text-sm font-semibold text-cinemo-bg">
                    로그인 하러가기
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
          <View className="flex-1 justify-end">
            <Pressable accessibilityLabel="더보기 닫기" onPress={() => setSheet(null)} className="absolute inset-0 bg-black/60" />
            <View
              accessibilityViewIsModal
              className="rounded-t-3xl border border-white/10 bg-cinemo-bg px-5 pt-3"
              style={{ paddingBottom: bottom + 12 }}
            >
              <View className="mb-4 h-1 w-9 self-center rounded-full bg-white/25" />
              <Text accessibilityRole="header" className="mb-2 text-lg font-semibold text-cinemo-text">
                {sheet?.title}
              </Text>
              {sheet?.message && <Text className="mb-3 text-cinemo-muted">{sheet.message}</Text>}
              {sheet?.actions?.map(({ label, icon: Icon, danger, onPress }) => (
                <Pressable
                  key={label}
                  accessibilityRole="button"
                  className="min-h-12 flex-row items-center gap-3 px-1"
                  onPress={() => {
                    setSheet(null);
                    onPress();
                  }}
                >
                  {Icon && <Icon size={18} color={danger ? "#f87171" : CINEMO_COLORS.accentLight} />}
                  <Text className={danger ? "font-semibold text-red-400" : "font-semibold text-cinemo-text"}>
                    {label}
                  </Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" onPress={() => setSheet(null)} className="min-h-12 items-center justify-center">
                <Text className="font-semibold text-cinemo-muted">{sheet?.actions ? "취소" : "닫기"}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

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

              <View className="mt-5 flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-cinemo-gold">
                  {postcardTypeLabels[postcard.type]}
                </Text>
                <Text numberOfLines={1} className="min-w-0 flex-1 text-right text-xs text-cinemo-muted">
                  {postcard.author?.nickname ?? "익명"} ·{" "}
                  {formatDate(postcard.createdAt)}
                </Text>
                {(isOwnPostcard || postcard.visibility === "PUBLIC") && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={reportMutation.isSuccess ? "엽서 신고 접수됨" : "엽서 더보기"}
                    hitSlop={8}
                    className="h-7 w-8 shrink-0 items-center justify-center"
                    disabled={postcardDelete.isPending || reportMutation.isPending || blockAuthor.isPending}
                    onPress={() => openActions()}
                  >
                    {reportMutation.isSuccess ? (
                      <Check size={17} color={CINEMO_COLORS.accentLight} />
                    ) : (
                      <Ellipsis size={20} color={CINEMO_COLORS.textSecondary} />
                    )}
                  </Pressable>
                )}
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
                    {postcard.commentCount}
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
                댓글 {postcard.commentCount}
              </Text>

              {hasSession ? (
                <View className="mt-4 flex-row items-center gap-2 rounded-2xl border border-white/15 bg-cinemo-surface p-3">
                  <TextInput
                    ref={composeInputRef}
                    value={comment}
                    onChangeText={setComment}
                    placeholder="댓글을 남겨보세요"
                    placeholderTextColor={CINEMO_COLORS.textSecondary}
                    multiline
                    maxLength={1000}
                    scrollEnabled
                    textAlignVertical="top"
                    style={{ height: 56, paddingTop: 8, paddingBottom: 8, lineHeight: 20 }}
                    onFocus={() => {
                      if (Keyboard.isVisible()) requestAnimationFrame(revealCommentInput);
                    }}
                    className="flex-1 px-1 text-cinemo-text"
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
                              uri: getCommentProfileImageUrl(item) ?? undefined,
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
                        <View className="min-h-8 flex-row items-center gap-2">
                          <Text numberOfLines={1} className="shrink font-semibold text-cinemo-text">
                            {getCommentAuthor(item)}
                          </Text>
                          <Text className="shrink-0 text-xs text-cinemo-muted">
                            {formatCommentDate(item.createdAt)}
                          </Text>
                          {item.status === "PUBLISHED" &&
                            (!hasSession || viewerQuery.data) &&
                            (postcard.visibility === "PUBLIC" ||
                              (hasSession && item.author?.id === viewerQuery.data?.id)) && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`${getCommentAuthor(item)} 댓글 더보기`}
                              hitSlop={8}
                              className="ml-auto h-7 w-8 shrink-0 items-center justify-center"
                              disabled={commentDelete.isPending || commentReport.isPending || commentUpdate.isPending || blockAuthor.isPending}
                              onPress={() => openActions(item)}
                            >
                              <Ellipsis size={18} color={CINEMO_COLORS.textSecondary} />
                            </Pressable>
                          )}
                        </View>
                        {editing?.id === item.id ? (
                          <View className="mt-2 gap-2">
                            <TextInput
                              ref={editInputRef}
                              accessibilityLabel="댓글 수정"
                              multiline
                              scrollEnabled
                              textAlignVertical="top"
                              style={{ height: 88, lineHeight: 20 }}
                              onFocus={() => {
                                if (Keyboard.isVisible()) requestAnimationFrame(revealCommentInput);
                              }}
                              maxLength={1000}
                              editable={!commentUpdate.isPending}
                              value={editing.content}
                              onChangeText={(content) => setEditing({ id: item.id, content })}
                              className="rounded-xl border border-white/15 bg-cinemo-surface px-3 py-2 text-cinemo-text"
                            />
                            {commentUpdate.isError && (
                              <Text accessibilityRole="alert" className="text-xs text-red-400">
                                {commentErrorMessage(commentUpdate.error)}
                              </Text>
                            )}
                            <View className="flex-row justify-end gap-2">
                              <Pressable disabled={commentUpdate.isPending} onPress={() => setEditing(null)} className="px-3 py-2">
                                <Text className="text-cinemo-muted">취소</Text>
                              </Pressable>
                              <Pressable
                                disabled={commentUpdate.isPending || !editing.content.trim() || editing.content.trim() === item.content}
                                onPress={() => commentUpdate.mutate(editing)}
                                className="px-3 py-2 disabled:opacity-40"
                              >
                                <Text className="font-semibold text-cinemo-gold-light">
                                  {commentUpdate.isPending ? "저장 중" : "저장"}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : (
                          <Text className="leading-6 text-cinemo-text">{item.content}</Text>
                        )}
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
