import { CachedImage as Image } from "@/components/common/CachedImage";
import {
  getMovieSearchKey,
  movieTitleMatchRank,
  tmdbMovieSearchQueryOptions,
  unifiedSearchQueryOptions,
} from "@/lib/queries/movie-search.query";
import type {
  MovieSearchItemResponse,
  SearchTmdbMoviesResponse,
  UnifiedSearchPerson,
} from "@cinemo/api-contract";
import { importMovieFromTmdb } from "@/lib/api/movies";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { popularMoviesQueryOptions } from "@/lib/queries/movie-popular.query";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { getImageUrl } from "@/lib/utils";

type TmdbMovie = SearchTmdbMoviesResponse["results"][number];

type SearchListItem =
  | { kind: "section"; id: string; title: string }
  | { kind: "person"; id: string; person: UnifiedSearchPerson }
  | { kind: "local"; id: string; movie: MovieSearchItemResponse }
  | {
      kind: "tmdb";
      id: number;
      movie: TmdbMovie;
    };

export default function SearchScreen() {
  const searchInputRef = useRef<TextInput>(null);
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [importingTmdbId, setImportingTmdbId] = useState<number | null>(null);

  useEffect(() => {
    const query = keyword.trim();
    if (query.length < 2) return;

    const timer = setTimeout(() => setSubmittedKeyword(query), 350);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  const searchQuery = useQuery(
    unifiedSearchQueryOptions({
      query: submittedKeyword,
      page: 1,
      limit: 10,
    }),
  );

  const tmdbQuery = useQuery(
    tmdbMovieSearchQueryOptions({
      query: submittedKeyword,
      page: 1,
      enabled: submittedKeyword.length > 0,
    }),
  );

  const popularQuery = useQuery(
    popularMoviesQueryOptions({
      page: 1,
      limit: 10,
      enabled: submittedKeyword.length === 0,
    }),
  );

  const hasKorean = (value: string) => /[가-힣0-9]/.test(value);

  const movies = submittedKeyword
    ? (searchQuery.data?.movies ?? [])
    : (popularQuery.data?.items.filter((item) => hasKorean(item.title)) ?? []);
  const people = submittedKeyword ? (searchQuery.data?.people ?? []) : [];

  const localMovieKeys = new Set(
    movies.map((movie) => getMovieSearchKey(movie.title, movie.releaseDate)),
  );
  const tmdbMovies = (tmdbQuery.data?.results ?? []).filter(
    (movie) =>
      !localMovieKeys.has(getMovieSearchKey(movie.title, movie.release_date)),
  );
  const movieItems = [
    ...movies.map((movie) => ({ kind: "local" as const, id: movie.id, movie })),
    ...tmdbMovies.map((movie) => ({
      kind: "tmdb" as const,
      id: movie.id,
      movie,
    })),
  ].sort(
    (first, second) =>
      movieTitleMatchRank(second.movie.title, submittedKeyword) -
      movieTitleMatchRank(first.movie.title, submittedKeyword),
  );
  const listItems: SearchListItem[] = submittedKeyword
    ? [
        ...(people.length > 0
          ? [{ kind: "section" as const, id: "people-section", title: "인물" }]
          : []),
        ...people.map((person) => ({
          kind: "person" as const,
          id: person.id,
          person,
        })),
        ...(movies.length > 0 || tmdbMovies.length > 0
          ? [{ kind: "section" as const, id: "movies-section", title: "영화" }]
          : []),
        ...movieItems,
      ]
    : movies.map((movie) => ({
        kind: "local" as const,
        id: movie.id,
        movie,
      }));

  const selectTmdbMovie = async (tmdbMovieId: number) => {
    if (importingTmdbId !== null) return;

    setImportingTmdbId(tmdbMovieId);
    try {
      const movieId = await importMovieFromTmdb(tmdbMovieId);
      router.push(`/movies/${movieId}`);
    } catch {
      Alert.alert("영화 추가 실패", "TMDB 영화 정보를 가져오지 못했습니다.");
    } finally {
      setImportingTmdbId(null);
    }
  };

  const submitSearch = () => {
    const query = keyword.trim();

    if (!query) return;

    setSubmittedKeyword(query);
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-cinemo-bg">
      <CinemoBackground />
      <View className="flex-row items-center gap-2 px-5 pb-4">
        <View className="relative flex-1">
          <TextInput
            ref={searchInputRef}
            autoFocus
            showSoftInputOnFocus
            value={keyword}
            onPressIn={() => searchInputRef.current?.focus()}
            onChangeText={(value) => {
              setKeyword(value);
              if (value.trim().length < 2) {
                setSubmittedKeyword("");
              }
            }}
            onSubmitEditing={submitSearch}
            placeholder="영화·인물·장르 검색"
            placeholderTextColor="#8fb8b3"
            returnKeyType="search"
            className="h-12 w-full rounded-xl border border-cinemo-border bg-cinemo-surface px-4 pr-12 text-cinemo-text"
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
              <X size={18} color="#F3EFE6" />
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityLabel="검색"
          onPress={submitSearch}
          className="h-12 w-12 items-center justify-center rounded-xl bg-cinemo-gold"
        >
          <Search size={22} />
        </Pressable>
      </View>

      <FlatList
        data={listItems}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={5}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentContainerClassName="gap-4 px-5 "
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <View className="w-full pb-2">
            <Text className="text-2xl font-bold text-cinemo-text">
              {submittedKeyword ? `${submittedKeyword} 검색 결과` : "인기 영화"}
            </Text>
          </View>
        }

        ListEmptyComponent={
          submittedKeyword &&
          !searchQuery.isPending &&
          !tmdbQuery.isPending &&
          !searchQuery.isFetching &&
          !tmdbQuery.isFetching ? (
            <View className="items-center py-8">
              {searchQuery.isError ? (
                <>
                  <Text className="text-cinemo-text">
                    검색 결과를 불러오지 못했습니다.
                  </Text>
                  <Pressable
                    onPress={() => searchQuery.refetch()}
                    className="mt-3 rounded-xl border border-cinemo-gold/40 px-4 py-2"
                  >
                    <Text className="text-cinemo-gold">다시 시도</Text>
                  </Pressable>
                </>
              ) : tmdbQuery.isError ? (
                <>
                  <Text className="text-cinemo-text">
                    영화 검색 결과를 불러오지 못했습니다.
                  </Text>
                  <Pressable
                    onPress={() => tmdbQuery.refetch()}
                    className="mt-3 rounded-xl border border-cinemo-gold/40 px-4 py-2"
                  >
                    <Text className="text-cinemo-gold">다시 시도</Text>
                  </Pressable>
                </>
              ) : (
                <Text className="text-cinemo-muted">검색 결과가 없습니다.</Text>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          submittedKeyword &&
          (searchQuery.isFetching || tmdbQuery.isFetching) ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#D9B15A" />
              <Text className="mt-2 text-cinemo-muted">검색 중...</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.kind === "section") {
            return (
              <Text className="pb-1 pt-3 text-lg font-semibold text-cinemo-text">
                {item.title}
              </Text>
            );
          }

          if (item.kind === "person") {
            const profileUrl = getImageUrl(item.person.profileUrl);

            return (
              <Pressable
                className="flex-row items-center gap-4 rounded-2xl border border-cinemo-border bg-cinemo-surface px-4 py-3"
                onPress={() => router.push(`/people/${item.person.id}`)}
              >
                {profileUrl ? (
                  <Image
                    source={{ uri: profileUrl }}
                    imageWidth={56}
                    resizeMode="cover"
                    className="h-14 w-14 rounded-full"
                    accessibilityLabel={`${item.person.name} 프로필`}
                  />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-cinemo-bg">
                    <Text className="text-xs text-cinemo-muted">인물</Text>
                  </View>
                )}

                <View className="min-w-0 flex-1">
                  <Text className="text-base font-semibold text-cinemo-text">
                    {item.person.name}
                  </Text>
                  {item.person.nameEn ? (
                    <Text className="mt-1 text-sm text-cinemo-muted">
                      {item.person.nameEn}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }

          const posterUrl =
            item.kind === "local"
              ? getImageUrl(item.movie.posterUrl)
              : item.movie.poster_path
                ? `https://image.tmdb.org/t/p/w185${item.movie.poster_path}`
                : null;

          return (
            <Pressable
              className="flex-row gap-4"
              disabled={item.kind === "tmdb" && importingTmdbId !== null}
              onPress={() =>
                item.kind === "tmdb"
                  ? void selectTmdbMovie(item.movie.id)
                  : router.push(`/movies/${item.movie.id}`)
              }
            >
              {posterUrl ? (
                <Image
                  source={{ uri: posterUrl }}
                  imageWidth={96}
                  resizeMode="cover"
                  className="h-32 w-24 rounded-xl"
                />
              ) : (
                <View className="h-32 w-24 rounded-xl bg-cinemo-surface" />
              )}

              <View className="flex-1 justify-center">
                <Text className="text-lg font-semibold text-cinemo-text">
                  {item.movie.title}
                </Text>

                {(item.kind === "local"
                  ? item.movie.releaseDate
                  : item.movie.release_date) && (
                  <Text className="mt-2 text-cinemo-muted">
                    {(item.kind === "local"
                      ? item.movie.releaseDate
                      : item.movie.release_date
                    )?.slice(0, 10)}
                  </Text>
                )}

                {item.kind === "local" && item.movie.genres.length > 0 && (
                  <Text className="mt-1 text-cinemo-muted">
                    {item.movie.genres.join(" · ")}
                  </Text>
                )}
                {item.kind === "tmdb" && importingTmdbId === item.movie.id && (
                  <Text className="mt-1 text-cinemo-gold">
                    영화 불러오는 중...
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
