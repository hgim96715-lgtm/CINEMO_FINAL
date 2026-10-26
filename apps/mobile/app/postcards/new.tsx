import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Check, Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { MovieSearchItemResponse } from "@cinemo/api-contract";
import { CINEMO_COLORS } from "@cinemo/shared";
import { importMovieFromTmdb } from "@/lib/api/movies";
import {
  createPostcard,
  createPostcardQuoteSuggestion,
  updatePostcard,
  publishPostcard,
} from "@/lib/api/postcards";
import { movieDetailQueryOptions } from "@/lib/queries/movie-detail.query";
import {
  movieSearchQueryOptions,
  getMovieSearchKey,
  tmdbMovieDetailQueryOptions,
  tmdbMovieSearchQueryOptions,
} from "@/lib/queries/movie-search.query";
import { myPostcardsQueryOptions } from "@/lib/queries/postcard-feed.query";
import { postcardDetailQueryOptions } from "@/lib/queries/postcard-detail.query";
import { getImageUrl, getTmdbPosterPath } from "@/lib/utils";

type PostcardType = "REVIEW" | "QUOTE" | "SCENE";
type Visibility = "PUBLIC" | "PRIVATE";
type QuoteSource = "USER" | "OPENSUBTITLES";

type SelectedMovie = {
  id: string;
  title: string;
  posterUrl: string | null;
};

const postcardTypes: Array<{ value: PostcardType; label: string }> = [
  { value: "REVIEW", label: "감상" },
  { value: "QUOTE", label: "인용" },
  { value: "SCENE", label: "장면" },
];

function getMovieFromDetail(movie: {
  id: string;
  titles: Array<{ title: string; titleType: string }>;
  media: Array<{ mediaType: string; url: string; isPrimary: boolean }>;
}): SelectedMovie {
  const title =
    movie.titles.find((item) => item.titleType === "PRIMARY") ?? movie.titles[0];
  const poster =
    movie.media.find(
      (item) => item.mediaType === "POSTER" && item.isPrimary,
    ) ?? movie.media.find((item) => item.mediaType === "POSTER");

  return {
    id: movie.id,
    title: title?.title ?? "영화",
    posterUrl: getImageUrl(poster?.url ?? null),
  };
}

export default function NewPostcardScreen() {
  const params = useLocalSearchParams<{
    movieId?: string | string[];
    postcardId?: string | string[];
  }>();
  const movieIdParam = Array.isArray(params.movieId)
    ? params.movieId[0]
    : params.movieId;
  const editPostcardId = Array.isArray(params.postcardId)
    ? params.postcardId[0]
    : params.postcardId;
  const isEditMode = Boolean(editPostcardId);
  const movieDetailQuery = useQuery(
    movieDetailQueryOptions(movieIdParam ?? ""),
  );
  const editingPostcardQuery = useQuery(
    postcardDetailQueryOptions(editPostcardId ?? ""),
  );
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<SelectedMovie | null>(
    null,
  );
  const [type, setType] = useState<PostcardType>("REVIEW");
  const [content, setContent] = useState("");
  const [quoteTranslation, setQuoteTranslation] = useState("");
  const [quoteSource, setQuoteSource] = useState<QuoteSource | null>(null);
  const [quoteOriginalLanguage, setQuoteOriginalLanguage] = useState<string | null>(
    null,
  );
  const [isAiSuggested, setIsAiSuggested] = useState(false);
  const [sceneTime, setSceneTime] = useState("");
  const [sceneImageUrl, setSceneImageUrl] = useState("");
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(
    null,
  );
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [importingTmdbId, setImportingTmdbId] = useState<number | null>(null);

  const movieSearchQuery = useQuery(
    movieSearchQueryOptions({
      query: submittedKeyword,
      page: 1,
      limit: 10,
    }),
  );
  const tmdbMovieSearchQuery = useQuery(
    tmdbMovieSearchQueryOptions({
      query: submittedKeyword,
      page: 1,
      enabled: submittedKeyword.trim().length > 0,
    }),
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMovie) {
        throw new Error("영화를 선택해 주세요.");
      }

      const input = {
        type,
        content: content.trim(),
        quoteSource: type === "QUOTE" ? (quoteSource ?? "USER") : undefined,
        visibility,
        metadata:
          type === "QUOTE"
            ? {
                type,
                originalLanguage: quoteOriginalLanguage,
                translations: quoteTranslation.trim()
                  ? [
                      {
                        language: "ko",
                        content: quoteTranslation.trim(),
                        source: "USER" as const,
                      },
                    ]
                  : [],
                isAiSuggested,
              }
            : type === "SCENE"
              ? { type, sceneTime: sceneTime.trim() || null }
              : { type },
        media:
          type === "SCENE" && sceneImageUrl.trim()
            ? [
                {
                  type: "IMAGE" as const,
                  url: sceneImageUrl.trim(),
                  sortOrder: 0,
                },
              ]
            : undefined,
      };

      if (editPostcardId) {
        const updated = await updatePostcard(editPostcardId, input);

        return updated.status === "DRAFT"
          ? publishPostcard(updated.id)
          : updated;
      }

      const draft = await createPostcard({
        movieId: selectedMovie.id,
        ...input,
      });

      return publishPostcard(draft.id);
    },
    onSuccess: async (postcard) => {
      await queryClient.invalidateQueries({
        queryKey: myPostcardsQueryOptions().queryKey,
      });
      if (editPostcardId) {
        await queryClient.invalidateQueries({
          queryKey: postcardDetailQueryOptions(editPostcardId).queryKey,
        });
      }
      router.replace(`/postcards/${postcard.id}`);
    },
  });

  const quoteSuggestionMutation = useMutation({
    mutationFn: () => {
      if (!selectedMovie) {
        throw new Error("영화를 먼저 선택해 주세요.");
      }

      return createPostcardQuoteSuggestion({
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
      });
    },
    onSuccess: (result) => {
      if (!result.found || !result.original || !result.translation) {
        setAiSuggestionError("확인 가능한 영화 인용구를 찾지 못했습니다.");
        return;
      }

      setContent(result.original);
      setQuoteTranslation(result.translation);
      setQuoteSource(result.quoteSource);
      setQuoteOriginalLanguage(result.sourceLanguage);
      setIsAiSuggested(result.isAiSuggested);
      setAiSuggestionError(null);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          setAiSuggestionError(
            "AI 추천 응답이 오래 걸리고 있습니다. 잠시 후 다시 시도해 주세요.",
          );
          return;
        }

        const responseMessage = error.response?.data?.message;
        const message = Array.isArray(responseMessage)
          ? responseMessage.join(" ")
          : typeof responseMessage === "string"
            ? responseMessage
            : null;

        setAiSuggestionError(
          message ??
            `AI 추천을 불러오지 못했습니다. (${error.response?.status ?? "네트워크 오류"})`,
        );
        return;
      }

      setAiSuggestionError("AI 추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    },
  });

  useEffect(() => {
    if (movieDetailQuery.data) {
      setSelectedMovie(getMovieFromDetail(movieDetailQuery.data));
    }
  }, [movieDetailQuery.data]);

  useEffect(() => {
    const postcard = editingPostcardQuery.data;

    if (!postcard) return;

    const metadata = postcard.metadata;
    const translation =
      metadata?.type === "QUOTE"
        ? metadata.translations?.find(
            (item) => item.language.toLowerCase() === "ko",
          )?.content ?? ""
        : "";

    setSelectedMovie(
      postcard.movie
        ? {
            id: postcard.movieId,
            title: postcard.movie.title,
            posterUrl: getImageUrl(postcard.movie.posterUrl),
          }
        : null,
    );
    setType(postcard.type);
    setContent(postcard.content);
    setQuoteTranslation(translation);
    setQuoteSource(postcard.type === "QUOTE" ? postcard.quoteSource : null);
    setQuoteOriginalLanguage(metadata?.originalLanguage ?? null);
    setIsAiSuggested(Boolean(metadata?.isAiSuggested));
    setSceneTime(metadata?.sceneTime ?? "");
    setSceneImageUrl(
      postcard.media.find((media) => media.type === "IMAGE")?.url ?? "",
    );
    setVisibility(postcard.visibility);
  }, [editingPostcardQuery.data]);

  const submitSearch = () => {
    const value = keyword.trim();

    if (value) {
      setSubmittedKeyword(value);
    }
  };

  const selectMovie = (movie: MovieSearchItemResponse) => {
    setSelectedMovie({
      id: movie.id,
      title: movie.title,
      posterUrl: getImageUrl(movie.posterUrl),
    });
    setKeyword("");
    setSubmittedKeyword("");
  };

  const selectTmdbMovie = async (tmdbMovieId: number) => {
    if (importingTmdbId !== null) return;

    setImportingTmdbId(tmdbMovieId);
    try {
      const movieId = await importMovieFromTmdb(tmdbMovieId);
      const movie = await queryClient.fetchQuery(
        movieDetailQueryOptions(movieId),
      );

      if (movie) {
        setSelectedMovie(getMovieFromDetail(movie));
        setKeyword("");
        setSubmittedKeyword("");
      }
    } catch {
      Alert.alert("영화 추가 실패", "TMDB 영화 정보를 가져오지 못했습니다.");
    } finally {
      setImportingTmdbId(null);
    }
  };

  const localMovies = movieSearchQuery.data?.items ?? [];
  const localMovieTitles = new Set(
    localMovies.map((movie) =>
      getMovieSearchKey(movie.title, movie.releaseDate),
    ),
  );
  const tmdbMovies = (tmdbMovieSearchQuery.data?.results ?? []).filter(
    (movie) =>
      !localMovieTitles.has(
        getMovieSearchKey(movie.title, movie.release_date),
      ),
  );
  const tmdbPosterQueries = useQueries({
    queries: tmdbMovies.map((movie) => tmdbMovieDetailQueryOptions(movie.id)),
  });
  const tmdbPosterById = new Map(
    tmdbMovies.map((movie, index) => [
      movie.id,
      getTmdbPosterPath(movie.poster_path) ??
        getTmdbPosterPath(tmdbPosterQueries[index]?.data?.poster_path),
    ]),
  );

  const canSave = selectedMovie !== null && content.trim().length > 0;

  if (isEditMode && editingPostcardQuery.isPending) {
    return (
      <SafeAreaView
        edges={[]}
        className="flex-1 items-center justify-center bg-cinemo-bg"
      >
        <ActivityIndicator color={CINEMO_COLORS.accentLight} />
        <Text className="mt-3 text-sm text-cinemo-muted">
          엽서를 불러오는 중...
        </Text>
      </SafeAreaView>
    );
  }

  if (isEditMode && (editingPostcardQuery.isError || !editingPostcardQuery.data)) {
    return (
      <SafeAreaView
        edges={[]}
        className="flex-1 items-center justify-center bg-cinemo-bg px-5"
      >
        <Text className="text-center text-sm text-cinemo-muted">
          수정할 엽서를 불러오지 못했습니다.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-xl bg-cinemo-gold px-5 py-3"
        >
          <Text className="font-semibold text-cinemo-bg">돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="내 엽서로 돌아가기"
            onPress={() => router.back()}
            className="mb-6 flex-row items-center gap-1 self-start"
          >
            <ArrowLeft size={18} color={CINEMO_COLORS.textSecondary} />
            <Text className="text-sm text-cinemo-muted">내 엽서로 돌아가기</Text>
          </Pressable>

          <Text className="text-xs font-semibold tracking-[4px] text-cinemo-gold">
            {isEditMode ? "EDIT POSTCARD" : "CREATE POSTCARD"}
          </Text>
          <Text className="mt-2 text-2xl font-bold text-cinemo-text">
            {isEditMode ? "엽서 수정하기" : "영화의 순간을 엽서로 남기기"}
          </Text>

          <View
            className="mt-6 overflow-hidden rounded-3xl border p-5"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          >
            {!selectedMovie ? (
              <View>
                <Text className="text-sm font-semibold text-cinemo-gold">
                  엽서를 만들 영화 선택
                </Text>
                <Text className="mt-2 text-sm text-cinemo-muted">
                  영화 제목을 검색하고 포스터를 눌러 선택
                </Text>

                <View className="mt-4 flex-row items-center gap-2">
                  <View className="relative flex-1">
                    <TextInput
                      value={keyword}
                      onChangeText={setKeyword}
                      onSubmitEditing={submitSearch}
                      placeholder="영화 제목 검색"
                      placeholderTextColor={CINEMO_COLORS.textSecondary}
                      returnKeyType="search"
                      className="h-12 w-full rounded-xl border border-white/15 bg-cinemo-bg px-4 pr-12 text-cinemo-text"
                    />
                    {keyword.length > 0 && (
                      <Pressable
                        accessibilityLabel="검색어 지우기"
                        onPress={() => {
                          setKeyword("");
                          setSubmittedKeyword("");
                        }}
                        className="absolute right-1 top-0 h-12 w-10 items-center justify-center"
                      >
                        <X size={18} color={CINEMO_COLORS.textSecondary} />
                      </Pressable>
                    )}
                  </View>
                  <Pressable
                    accessibilityLabel="영화 검색"
                    onPress={submitSearch}
                    className="h-12 w-12 items-center justify-center rounded-xl bg-cinemo-gold"
                  >
                    <Search size={20} color={CINEMO_COLORS.background} />
                  </Pressable>
                </View>

                {submittedKeyword &&
                  (movieSearchQuery.isFetching ||
                    tmdbMovieSearchQuery.isFetching) && (
                  <View className="items-center py-8">
                    <ActivityIndicator color={CINEMO_COLORS.accentLight} />
                    <Text className="mt-3 text-sm text-cinemo-muted">
                      영화를 찾는 중...
                    </Text>
                  </View>
                )}

                <View className="mt-4 gap-2">
                  {localMovies.map((movie) => (
                    <Pressable
                      key={movie.id}
                      onPress={() => selectMovie(movie)}
                      className="flex-row items-center gap-3 rounded-xl border border-white/10 p-2"
                    >
                      {movie.posterUrl ? (
                        <Image
                          source={{ uri: getImageUrl(movie.posterUrl) ?? undefined }}
                          resizeMode="cover"
                          className="h-16 w-12 rounded-lg"
                        />
                      ) : (
                        <View className="h-16 w-12 rounded-lg bg-cinemo-bg" />
                      )}
                      <Text className="flex-1 text-sm text-cinemo-text">
                        {movie.title}
                      </Text>
                    </Pressable>
                  ))}

                  {submittedKeyword &&
                    movieSearchQuery.isSuccess &&
                    localMovies.length === 0 &&
                    tmdbMovieSearchQuery.isPending && (
                      <Text className="py-4 text-center text-sm text-cinemo-muted">
                        외부 영화 정보를 찾는 중...
                      </Text>
                    )}

                  {tmdbMovies.map((movie) => (
                    <Pressable
                      key={`tmdb-${movie.id}`}
                      onPress={() => void selectTmdbMovie(movie.id)}
                      disabled={importingTmdbId !== null}
                      className="flex-row items-center gap-3 rounded-xl border border-cinemo-gold/30 p-2"
                      style={{ opacity: importingTmdbId !== null ? 0.6 : 1 }}
                    >
                      {tmdbPosterById.get(movie.id) ? (
                        <Image
                          source={{
                            uri: `https://image.tmdb.org/t/p/w185${tmdbPosterById.get(movie.id)}`,
                          }}
                          resizeMode="cover"
                          className="h-16 w-12 rounded-lg"
                        />
                      ) : (
                        <View className="h-16 w-12 rounded-lg bg-cinemo-bg" />
                      )}
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm text-cinemo-text">
                          {movie.title}
                        </Text>
                        {importingTmdbId === movie.id && (
                          <Text className="mt-1 text-xs text-cinemo-gold">
                            영화 불러오는 중...
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}

                  {submittedKeyword &&
                    movieSearchQuery.isSuccess &&
                    tmdbMovieSearchQuery.isSuccess &&
                    localMovies.length === 0 &&
                    tmdbMovies.length === 0 && (
                      <Text className="py-8 text-center text-sm text-cinemo-muted">
                        검색 결과가 없습니다.
                      </Text>
                    )}
                </View>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center gap-3">
                  {selectedMovie.posterUrl ? (
                    <Image
                      source={{ uri: selectedMovie.posterUrl }}
                      resizeMode="cover"
                      className="h-24 w-16 rounded-xl"
                    />
                  ) : (
                    <View className="h-24 w-16 rounded-xl bg-cinemo-bg" />
                  )}
                  <View className="min-w-0 flex-1">
                    <Text className="text-xs text-cinemo-gold">선택한 영화</Text>
                    <Text className="mt-2 text-lg font-semibold text-cinemo-text">
                      {selectedMovie.title}
                    </Text>
                  </View>
                  {!isEditMode && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="영화 다시 선택"
                      onPress={() => setSelectedMovie(null)}
                      className="rounded-lg border border-white/15 px-3 py-2"
                    >
                      <Text className="text-xs text-cinemo-muted">변경</Text>
                    </Pressable>
                  )}
                </View>

                <Text className="mt-7 text-sm font-semibold text-cinemo-gold">
                  엽서 유형
                </Text>
                <View className="mt-3 flex-row gap-2">
                  {postcardTypes.map((option) => {
                    const isActive = option.value === type;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setType(option.value);
                          setAiSuggestionError(null);
                        }}
                        className="flex-1 items-center rounded-xl border px-3 py-3"
                        style={{
                          borderColor: isActive
                            ? CINEMO_COLORS.accentLight
                            : "rgba(255,255,255,0.12)",
                          backgroundColor: isActive
                            ? "rgba(212,181,106,0.16)"
                            : "transparent",
                        }}
                      >
                        <Text
                          className={
                            isActive
                              ? "font-semibold text-cinemo-gold-light"
                              : "text-cinemo-muted"
                          }
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {type === "QUOTE" ? (
                  <View className="mt-5 rounded-2xl border border-dashed border-white/15 p-4">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-sm font-semibold text-cinemo-gold">
                        기억하고 싶은 인용구
                      </Text>
                      {quoteSource === "OPENSUBTITLES" && (
                        <Text className="rounded-full border border-cinemo-gold/40 px-2 py-1 text-[11px] text-cinemo-gold">
                          실제 자막 기반 문구
                        </Text>
                      )}
                    </View>
                    <Text className="mt-1 text-xs text-cinemo-muted">
                      영화 속 문장이나 대사를 남겨보세요.
                    </Text>

                    <Text className="mt-4 text-xs font-semibold text-cinemo-gold">
                      원문
                    </Text>
                    <TextInput
                      value={content}
                      onChangeText={(value) => {
                        setContent(value);
                        setIsAiSuggested(false);
                        setQuoteSource("USER");
                      }}
                      multiline
                      maxLength={5000}
                      textAlignVertical="top"
                      placeholder="기억하고 싶은 영화 속 문장이나 대사를 적어보세요."
                      placeholderTextColor={CINEMO_COLORS.textSecondary}
                      className="mt-2 min-h-32 rounded-xl border border-white/10 bg-cinemo-bg px-4 py-4 text-base leading-6 text-cinemo-text"
                    />
                    <Text className="mt-1 text-right text-xs text-cinemo-muted">
                      {content.length}/5000
                    </Text>

                    <Text className="mt-3 text-xs font-semibold text-cinemo-gold">
                      한국어 번역
                    </Text>
                    <TextInput
                      value={quoteTranslation}
                      onChangeText={setQuoteTranslation}
                      multiline
                      maxLength={5000}
                      textAlignVertical="top"
                      placeholder="원문의 한국어 번역을 적어보세요."
                      placeholderTextColor={CINEMO_COLORS.textSecondary}
                      className="mt-2 min-h-32 rounded-xl border border-white/10 bg-cinemo-bg px-4 py-4 text-base leading-6 text-cinemo-text"
                    />
                    <Text className="mt-1 text-right text-xs text-cinemo-muted">
                      {quoteTranslation.length}/5000
                    </Text>

                    <View className="mt-4 flex-row items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isAiSuggested }}
                        onPress={() => setIsAiSuggested((current) => !current)}
                        className="flex-row items-center gap-2"
                      >
                        <View
                          className="h-5 w-5 items-center justify-center rounded border"
                          style={{
                            borderColor: isAiSuggested
                              ? CINEMO_COLORS.accentLight
                              : "rgba(255,255,255,0.3)",
                            backgroundColor: isAiSuggested
                              ? CINEMO_COLORS.accentLight
                              : "transparent",
                          }}
                        >
                          {isAiSuggested && (
                            <Check size={14} color={CINEMO_COLORS.background} />
                          )}
                        </View>
                        <Text className="text-sm text-cinemo-gold">
                          AI 추천 문장
                        </Text>
                      </Pressable>
                      <Pressable
                        disabled={quoteSuggestionMutation.isPending}
                        onPress={() => quoteSuggestionMutation.mutate()}
                        className="rounded-lg border border-cinemo-gold/50 px-3 py-2"
                        style={{ opacity: quoteSuggestionMutation.isPending ? 0.5 : 1 }}
                      >
                        <Text className="text-xs text-cinemo-gold">
                          {quoteSuggestionMutation.isPending
                            ? "추천 중..."
                            : "AI 추천받기"}
                        </Text>
                      </Pressable>
                    </View>
                    {aiSuggestionError && (
                      <Text className="mt-3 text-xs text-red-300">
                        {aiSuggestionError}
                      </Text>
                    )}
                  </View>
                ) : (
                  <View className="mt-5 rounded-2xl border border-dashed border-white/15 p-4">
                    <Text className="text-sm font-semibold text-cinemo-gold">
                      {type === "REVIEW" ? "감상 후기" : "기억에 남은 장면"}
                    </Text>
                    <Text className="mt-1 text-xs text-cinemo-muted">
                      {type === "REVIEW"
                        ? "이 영화를 보고 어떤 마음이 남았는지 적어보세요."
                        : "장면에 대한 기억과 영화 속 위치를 남겨보세요."}
                    </Text>
                    <TextInput
                      value={content}
                      onChangeText={setContent}
                      multiline
                      maxLength={5000}
                      textAlignVertical="top"
                      placeholder={
                        type === "REVIEW"
                          ? "영화를 보고 난 뒤의 감상을 남겨보세요."
                          : "어떤 장면이 기억에 남았는지 적어보세요."
                      }
                      placeholderTextColor={CINEMO_COLORS.textSecondary}
                      className="mt-4 min-h-36 rounded-xl border border-white/10 bg-cinemo-bg px-4 py-4 text-base leading-6 text-cinemo-text"
                    />
                    <Text className="mt-1 text-right text-xs text-cinemo-muted">
                      {content.length}/5000
                    </Text>

                    {type === "SCENE" && (
                      <>
                        <Text className="mt-4 text-xs font-semibold text-cinemo-gold">
                          장면 위치
                        </Text>
                        <TextInput
                          value={sceneTime}
                          onChangeText={setSceneTime}
                          placeholder="예: 01:12:30 또는 영화 초반부"
                          placeholderTextColor={CINEMO_COLORS.textSecondary}
                          className="mt-2 h-12 rounded-xl border border-white/10 bg-cinemo-bg px-4 text-base text-cinemo-text"
                        />

                        <Text className="mt-4 text-xs font-semibold text-cinemo-gold">
                          장면 이미지
                        </Text>
                        <Text className="mt-1 text-xs text-cinemo-muted">
                          이미지 업로드 연동 전까지 URL로 첨부할 수 있음
                        </Text>
                        <TextInput
                          value={sceneImageUrl}
                          onChangeText={setSceneImageUrl}
                          autoCapitalize="none"
                          keyboardType="url"
                          placeholder="https://example.com/scene-image.jpg"
                          placeholderTextColor={CINEMO_COLORS.textSecondary}
                          className="mt-2 h-12 rounded-xl border border-white/10 bg-cinemo-bg px-4 text-base text-cinemo-text"
                        />
                      </>
                    )}
                  </View>
                )}

                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: visibility === "PUBLIC" }}
                  onPress={() =>
                    setVisibility((current) =>
                      current === "PUBLIC" ? "PRIVATE" : "PUBLIC",
                    )
                  }
                  className="mt-5 flex-row items-center justify-between rounded-xl border border-white/10 px-4 py-3"
                >
                  <View>
                    <Text className="text-sm text-cinemo-text">
                      {visibility === "PUBLIC"
                        ? "공개 엽서 피드에 표시"
                        : "내 엽서에서만 표시"}
                    </Text>
                    <Text className="mt-1 text-xs text-cinemo-muted">
                      공개 범위
                    </Text>
                  </View>
                  <View
                    className="h-6 w-11 rounded-full p-1"
                    style={{
                      backgroundColor:
                        visibility === "PUBLIC"
                          ? CINEMO_COLORS.accentLight
                          : "rgba(255,255,255,0.2)",
                    }}
                  >
                    <View
                      className="h-4 w-4 rounded-full bg-white"
                      style={{
                        transform: [
                          { translateX: visibility === "PUBLIC" ? 20 : 0 },
                        ],
                      }}
                    />
                  </View>
                </Pressable>

                {saveMutation.isError && (
                  <Text className="mt-4 text-sm text-red-300">
                    엽서를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.
                  </Text>
                )}

                <Pressable
                  disabled={!canSave || saveMutation.isPending}
                  onPress={() => saveMutation.mutate()}
                  className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-cinemo-gold px-4 py-4"
                  style={{ opacity: !canSave || saveMutation.isPending ? 0.5 : 1 }}
                >
                  {saveMutation.isPending ? (
                    <ActivityIndicator color={CINEMO_COLORS.background} />
                  ) : (
                    <Check size={18} color={CINEMO_COLORS.background} />
                  )}
                  <Text className="font-semibold text-cinemo-bg">
                    {saveMutation.isPending
                      ? "저장 중..."
                      : isEditMode
                        ? "변경사항 저장"
                        : "엽서 저장"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
