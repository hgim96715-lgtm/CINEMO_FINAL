import { queryOptions } from "@tanstack/react-query";
import { getMovie } from "@/lib/api/movies";

export const movieDetailQueryOptions = (movieId: string) =>
  queryOptions({
    queryKey: ["movies", "detail", movieId],
    queryFn: ({ signal }) => getMovie(movieId, signal),
    enabled: movieId.trim().length > 0,
    // 웹에서 TMDB/KMDB 보강이 완료된 뒤에도 이전 상세 캐시를 보여주지 않도록
    // 상세 화면에 진입할 때마다 최신 줄거리·감독 정보를 다시 조회함.
    staleTime: 0,
    refetchOnMount: "always",
  });
