"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { movieSearchQueryOptions } from "@/lib/queries/movie-search.query";
import { MovieSearchList } from "@/components/movies/MovieSearchList";
import { ApiErrorState } from "@/components/common/ApiErrorState";

export default function MoviesPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";

  const { data, isPending, isError, refetch } = useQuery(
    movieSearchQueryOptions({ query, page: 1, limit: 10 }),
  );

  if (!query) {
    return <main>검색어를 입력해주세요.</main>;
  }
  if (isPending) {
    return <main>영화를 불러오는 중...</main>;
  }
  if (isError) {
    return (
      <ApiErrorState
        message="영화 검색 결과를 불러오지 못했습니다."
        onRetry={() => refetch()}
      />
    );
  }

  if (data.items.length === 0) {
    return (
      <main>
        <h1>&quot;{query}&quot; 검색 결과</h1>
        <p>검색 결과가 없습니다.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>&quot;{query}&quot; 검색 결과</h1>

      <p>총 {data.totalCount}편</p>
      <MovieSearchList movies={data.items} />
    </main>
  );
}
