export interface TmdbMovieSummary {
  adult: boolean;
  backdrop_path: string | null;
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TmdbMovieSearchResponse {
  page: number;
  results: TmdbMovieListItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieListItem extends TmdbMovieSummary {
  genre_ids: number[];
}

export interface TmdbMovieDateRange {
  maximum: string;
  minimum: string;
}

export interface TmdbMovieListResponse {
  page: number;
  results: TmdbMovieListItem[];
  total_pages: number;
  total_results: number;
  dates?: TmdbMovieDateRange;
}

export interface TmdbMovieReleaseDatesResponse {
  id: number;
  results: TmdbMovieReleaseCountry[];
}

export interface TmdbMovieReleaseCountry {
  iso_3166_1: string;
  release_dates: TmdbMovieReleaseDate[];
}

export interface TmdbMovieReleaseDate {
  certification: string;
  iso_639_1: string;
  note: string | null;
  release_date: string;
  type: number;
}

export interface TmdbMovieVideosResponse {
  id: number;
  results: TmdbMovieVideo[];
}

export interface TmdbMovieVideo {
  iso_639_1: string | null;
  iso_3166_1: string | null;
  name: string;
  key: string;
  size: number;
  site: "YouTube" | "Vimeo";
  type: "Trailer" | "Teaser" | "Clip" | "Featurette";
  official: boolean;
  id: string;
  published_at: string;
}

export interface TmdbGenreListResponse {
  genres: TmdbMovieGenre[];
}

export interface TmdbMovieGenre {
  id: number;
  name: string;
}

export interface TmdbMovieCollection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface TmdbProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TmdbProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TmdbSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TmdbMovieDetailResponse extends TmdbMovieSummary {
  genres: TmdbMovieGenre[];
  belongs_to_collection: TmdbMovieCollection | null;
  budget: number;
  homepage: string | null;
  imdb_id: string | null;
  origin_country: string[];
  production_companies: TmdbProductionCompany[];
  production_countries: TmdbProductionCountry[];
  revenue: number;
  runtime: number | null;
  spoken_languages: TmdbSpokenLanguage[];
  status: string;
  tagline: string | null;
}

export interface TmdbMovieCreditsResponse {
  id: number;
  cast: TmdbMovieCast[];
  crew: TmdbMovieCrew[];
}

export interface TmdbMovieCast {
  id: number;
  name: string;
  original_name?: string;
  character: string;
  order: number;
}

export interface TmdbMovieCrew {
  id: number;
  name: string;
  original_name?: string;
  job: string;
  department: string;
}

export interface TmdbPersonDetailResponse {
  id: number;
  name: string;
  original_name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string | null;
  deathday: string | null;
}

export interface TmdbPersonSearchResponse {
  page: number;
  results: TmdbPersonSearchItem[];
  total_pages: number;
  total_results: number;
}

export interface TmdbPersonSearchItem {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  known_for_department: string | null;
}


export interface TmdbMovieWatchProvidersResponse {
  id: number;
  // 국가 코드가 동적으로 들어오므로 Record로 정의
  // 예: results.KR, results.US, results.JP
  results: Record<string, TmdbWatchProviderRegion>;
}

export interface TmdbWatchProviderRegion {
  link: string;
  flatrate?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
}

export interface TmdbWatchProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}