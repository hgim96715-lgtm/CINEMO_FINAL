export type SubdlSubtitleFile = {
  file_n_id?: string;
  name?: string;
  release_name?: string | null;
  language?: string;
  format?: string;
  size?: number;
  url?: string;
  hi?: boolean;
};

export type SubdlSubtitle = {
  name?: string;
  release_name?: string | null;
  url?: string;
  unpack_files?: SubdlSubtitleFile[];
};

export type SubdlMovieResult = {
  imdb_id?: string | null;
  tmdb_id?: number | null;
  type?: string;
  name?: string;
  sd_id?: number | null;
  year?: number | null;
};

export type SubdlSearchResponse = {
  status: boolean;
  error?: string;
  results?: SubdlMovieResult[];
  subtitles?: SubdlSubtitle[];
};

export type SubdlSearchOptions = {
  film_name?: string;
  imdb_id?: string;
  tmdb_id?: number;
  type?: "movie" | "tv";
  languages?: string;
  unpack?: 0 | 1;
  subs_per_page?: number;
  client?: "custom_integration" | "other";
};
