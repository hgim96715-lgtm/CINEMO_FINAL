export type OpenSubtitlesFeatureDetails = {
  feature_id: number;
  feature_type: string;
  year: number | null;
  title: string | null;
  movie_name: string | null;
  imdb_id: number | null;
  tmdb_id: number | null;
  season_number: number | null;
  episode_number: number | null;
  parent_imdb_id: number | null;
  parent_title: string | null;
  parent_tmdb_id: number | null;
  parent_feature_id: number | null;
};

export type OpenSubtitlesUploader = {
  uploader_id: number;
  name: string;
  rank: string;
};

export type OpenSubtitlesRelatedLink = {
  label: string;
  url: string;
  img_url: string;
};

export type OpenSubtitlesFile = {
  file_id: number;
  cd_number: number;
  file_name: string;
};

export type OpenSubtitlesSubtitleAttributes = {
  subtitle_id: string;
  language: string;
  download_count: number;
  new_download_count: number;
  hearing_impaired: boolean;
  hd: boolean;
  fps: number;
  votes: number;
  ratings: number;
  from_trusted: boolean;
  foreign_parts_only: boolean;
  upload_date: string;
  ai_translated: boolean;
  nb_cd: number;
  slug: string;
  machine_translated: boolean;
  release: string | null;
  comments: string | null;
  legacy_subtitle_id: number | null;
  legacy_uploader_id: number | null;
  uploader: OpenSubtitlesUploader | null;
  feature_details: OpenSubtitlesFeatureDetails;
  url: string;
  related_links: OpenSubtitlesRelatedLink[];
  files: OpenSubtitlesFile[];
};

export type OpenSubtitlesSubtitle = {
  id: string;
  type: string;
  attributes: OpenSubtitlesSubtitleAttributes;
};

export type OpenSubtitlesSearchResponse = {
  total_pages: number;
  total_count: number;
  per_page: number;
  page: number;
  data: OpenSubtitlesSubtitle[];
};

export type OpenSubtitlesDownloadResponse = {
  link: string;
  file_name: string;
  requests: number;
  remaining: number;
  message: string;
  reset_time: string;
  reset_time_utc: string;
};

export type OpenSubtitlesDownloadRequest = {
  file_id: number;
  sub_format?: string;
  file_name?: string;
  in_fps?: number;
  out_fps?: number;
  timeshift?: number;
  force_download?: boolean;
};

export type OpenSubtitlesSubtitleSearchItem = {
  fileId: number;
  subtitleId: string;
  title: string | null;
  language: string;
  fileName: string;
  release: string | null;
  aiTranslated: boolean;
  machineTranslated: boolean;
  hearingImpaired: boolean;
  downloadCount: number;
  imdbId: number | null;
  tmdbId: number | null;
};

export type OpenSubtitlesSubtitleSearchResult = {
  totalPages: number;
  totalCount: number;
  perPage: number;
  page: number;
  items: OpenSubtitlesSubtitleSearchItem[];
};

export type OpenSubtitlesDownloadResult = {
  url: string;
  fileName: string;
  requests: number;
  remaining: number;
  message: string;
  resetTime: string;
  resetTimeUtc: string;
};

export type OpenSubtitlesSubtitleCue = {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
};

export type OpenSubtitlesSubtitleContent = {
  fileName: string;
  format: "srt" | "vtt" | "text";
  cues: OpenSubtitlesSubtitleCue[];
  text: string;
};

export type OpenSubtitlesSearchOptions = {
  ai_translated?: "exclude" | "include";
  episode_number?: number;
  foreign_parts_only?: "exclude" | "include" | "only";
  hearing_impaired?: "include" | "exclude" | "only";
  id?: number;
  imdb_id?: number;
  languages?: string;
  machine_translated?: "exclude" | "include";
  moviehash?: string;
  moviehash_match?: "include" | "only";
  order_by?: string;
  order_direction?: "asc" | "desc";
  page?: number;
  parent_feature_id?: number;
  parent_imdb_id?: number;
  parent_tmdb_id?: number;
  query?: string;
  season_number?: number;
  tmdb_id?: number;
  trusted_sources?: "include" | "only";
  type?: "movie" | "episode" | "all";
  uploader_id?: number;
  year?: number;
};
