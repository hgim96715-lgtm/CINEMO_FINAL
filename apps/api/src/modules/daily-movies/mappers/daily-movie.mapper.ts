export type DailyMovieRecord = {
  id: string;
  titles: { title: string; languageCode: string | null }[];
  media: { url: string }[];
  movieGenres: { name: string }[];
};

export type DailyMovieCard = {
  id: string;
  title: string;
  posterUrl: string;
  genres: string[];
};

export type DailyMovieCandidate = Omit<DailyMovieCard, "posterUrl"> & {
  overview: string;
};

export function toDailyMovieCard(movie: DailyMovieRecord): DailyMovieCard | null {
  const title = movie.titles.find(
    (item) =>
      item.languageCode?.startsWith("ko") || /[가-힣]/u.test(item.title),
  ) ?? movie.titles[0];

  if (!title || !movie.media[0]) return null;

  return {
    id: movie.id,
    title: title.title,
    posterUrl: movie.media[0].url,
    genres: movie.movieGenres.map(({ name }) => name),
  };
}

export function toDailyMovieCandidate(
  movie: DailyMovieRecord & { overview: string | null },
): DailyMovieCandidate | null {
  const card = toDailyMovieCard(movie);
  const overview = movie.overview?.trim().slice(0, 420);

  return card && overview
    ? { id: card.id, title: card.title, genres: card.genres, overview }
    : null;
}
