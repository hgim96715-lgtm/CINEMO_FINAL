import {
  getMovieSearchKey,
  movieSearchQueryOptions,
  tmdbMovieDetailQueryOptions,
  tmdbMovieSearchQueryOptions,
} from "@/lib/queries/movie-search.query";
import { importMovieFromTmdb } from "@/lib/api/movies";
import { useQueries, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Search, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { popularMoviesQueryOptions } from "@/lib/queries/movie-popular.query";
import { CinemoBackground } from "@/components/common/CinemoBackground";
import { getImageUrl, getTmdbPosterPath } from "@/lib/utils";

export default function SearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const [importingTmdbId, setImportingTmdbId] = useState<number | null>(null);

  const searchQuery = useQuery(
    movieSearchQueryOptions({
      query: submittedKeyword,
      page: 1,
      limit: 10,
    }),
  );

  const tmdbQuery = useQuery(
    tmdbMovieSearchQueryOptions({
      query: submittedKeyword,
      page: 1,
      enabled: submittedKeyword.trim().length > 0,
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
    ? (searchQuery.data?.items ?? [])
    : (popularQuery.data?.items.filter((item) => hasKorean(item.title)) ?? []);

  const localMovieTitles = new Set(
    movies.map((movie) => getMovieSearchKey(movie.title, movie.releaseDate)),
  );
  const tmdbMovies = (tmdbQuery.data?.results ?? []).filter(
    (movie) =>
      !localMovieTitles.has(getMovieSearchKey(movie.title, movie.release_date)),
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

  const listItems = [
    ...movies.map((movie) => ({ kind: "local" as const, movie })),
    ...tmdbMovies.map((movie) => ({ kind: "tmdb" as const, movie })),
  ];

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
            autoFocus
            value={keyword}
            onChangeText={(value) => {
              setKeyword(value);
              if (value.trim().length === 0) {
                setSubmittedKeyword("");
              }
            }}
            onSubmitEditing={submitSearch}
            placeholder="영화 제목 검색"
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
        keyExtractor={(item) => `${item.kind}-${item.movie.id}`}
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
          submittedKeyword && !searchQuery.isPending && !tmdbQuery.isPending ? (
            <View className="items-center py-8">
              {searchQuery.isError ? (
                <>
                  <Text>검색 결과를 불러오지 못했습니다.</Text>
                  <Pressable onPress={() => searchQuery.refetch()}>
                    <Text className="mt-3">다시 시도</Text>
                  </Pressable>
                </>
              ) : tmdbQuery.isError ? (
                <>
                  <Text>외부 영화 검색을 불러오지 못했습니다.</Text>
                  <Pressable onPress={() => tmdbQuery.refetch()}>
                    <Text className="mt-3">다시 시도</Text>
                  </Pressable>
                </>
              ) : (
                <Text>검색 결과가 없습니다.</Text>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={
          submittedKeyword && (searchQuery.isFetching || tmdbQuery.isFetching) ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#D9B15A" />
              <Text className="mt-2 text-cinemo-muted">검색 중...</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const posterUrl =
            item.kind === "local"
              ? getImageUrl(item.movie.posterUrl)
              : tmdbPosterById.get(item.movie.id)
                ? `https://image.tmdb.org/t/p/w185${tmdbPosterById.get(item.movie.id)}`
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
