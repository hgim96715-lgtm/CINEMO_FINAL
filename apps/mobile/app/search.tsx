import { movieSearchQueryOptions } from "@/lib/queries/movie-search.query";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ChevronLeft, Search, X } from "lucide-react-native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { popularMoviesQueryOptions } from "@/lib/queries/movie-popular.query";

export default function SearchScreen() {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");

  const searchQuery = useQuery(
    movieSearchQueryOptions({
      query: submittedKeyword,
      page: 1,
      limit: 10,
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
    ? (searchQuery.data?.items.filter((item) => hasKorean(item.title)) ?? [])
    : (popularQuery.data?.items.filter((item) => hasKorean(item.title)) ?? []);

  const submitSearch = () => {
    const query = keyword.trim();

    if (!query) return;

    setSubmittedKeyword(query);
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-row items-center gap-2 px-5 py-4">
        <Pressable
          accessibilityLabel="뒤로 가기"
          className="h-12 w-12 items-center justify-center"
          onPress={() => router.replace("/lobby")}
        >
          <ChevronLeft size={24} />
        </Pressable>

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
          returnKeyType="search"
          className="h-12 flex-1 rounded-xl px-4"
        />
        {keyword.length > 0 && (
          <Pressable
            accessibilityLabel="검색어 지우기"
            onPress={() => {
              setKeyword("");
              setSubmittedKeyword("");
            }}
            className="h-12 w-10 items-center justify-center"
          >
            <X size={18} />
          </Pressable>
        )}

        <Pressable
          accessibilityLabel="검색"
          onPress={submitSearch}
          className="h-12 w-12 items-center justify-center rounded-xl"
        >
          <Search size={22} />
        </Pressable>
      </View>

      {submittedKeyword && searchQuery.isFetching && (
        <View className="items-center py-8">
          <ActivityIndicator />
          <Text className="mt-3">검색 중...</Text>
        </View>
      )}

      <FlatList
        data={movies}
        keyExtractor={(movie) => movie.id}
        contentContainerClassName="gap-4 px-5 "
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <View className="w-full pb-2">
            <Text className="text-2xl font-bold">
              {submittedKeyword ? `${submittedKeyword} 검색 결과` : "인기 영화"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          submittedKeyword && !searchQuery.isPending ? (
            <View className="items-center py-8">
              {searchQuery.isError ? (
                <>
                  <Text>검색 결과를 불러오지 못했습니다.</Text>
                  <Pressable onPress={() => searchQuery.refetch()}>
                    <Text className="mt-3">다시 시도</Text>
                  </Pressable>
                </>
              ) : (
                <Text>검색 결과가 없습니다.</Text>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row gap-4"
            onPress={() => router.push(`/movies/${item.id}`)}
          >
            {item.posterUrl ? (
              <Image
                source={{ uri: item.posterUrl }}
                resizeMode="cover"
                className="h-32 w-24 rounded-xl"
              />
            ) : (
              <View className="h-32 w-24 rounded-xl" />
            )}

            <View className="flex-1 justify-center">
              <Text className="text-lg font-semibold">{item.title}</Text>

              {item.releaseDate && (
                <Text className="mt-2">{item.releaseDate.slice(0, 10)}</Text>
              )}

              {item.genres.length > 0 && (
                <Text className="mt-1">{item.genres.join(" · ")}</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
