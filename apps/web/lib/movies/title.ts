type MovieTitleLike = {
  title: string;
  titleType: string;
  languageCode: string | null;
};

const isKoreanTitle = (movieTitle: MovieTitleLike) =>
  movieTitle.languageCode?.toLowerCase().startsWith("ko") === true ||
  /[가-힣]/.test(movieTitle.title);

/** 상세·히어로에서도 목록과 동일하게 한국어 제목을 우선 표시함. */
export function getPreferredMovieTitle(
  titles: readonly MovieTitleLike[],
): MovieTitleLike | undefined {
  return (
    titles.find(
      (movieTitle) =>
        movieTitle.titleType === "PRIMARY" && isKoreanTitle(movieTitle),
    ) ??
    titles.find(isKoreanTitle) ??
    titles.find((movieTitle) => movieTitle.titleType === "PRIMARY") ??
    titles[0]
  );
}
