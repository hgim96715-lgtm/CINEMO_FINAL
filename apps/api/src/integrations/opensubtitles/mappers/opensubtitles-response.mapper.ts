import type {
  OpenSubtitlesDownloadResponse,
  OpenSubtitlesDownloadResult,
  OpenSubtitlesSearchResponse,
  OpenSubtitlesSubtitle,
  OpenSubtitlesSubtitleSearchItem,
  OpenSubtitlesSubtitleSearchResult,
} from "../opensubtitles.types";

const toSubtitleSearchItem = (
  subtitle: OpenSubtitlesSubtitle,
): OpenSubtitlesSubtitleSearchItem | null => {
  const file = subtitle.attributes.files[0];

  if (!file) {
    return null;
  }

  const featureDetails = subtitle.attributes.feature_details;

  return {
    fileId: file.file_id,
    subtitleId: subtitle.attributes.subtitle_id,
    title: featureDetails.title ?? featureDetails.movie_name,
    language: subtitle.attributes.language,
    fileName: file.file_name,
    release: subtitle.attributes.release,
    aiTranslated: subtitle.attributes.ai_translated,
    machineTranslated: subtitle.attributes.machine_translated,
    hearingImpaired: subtitle.attributes.hearing_impaired,
    downloadCount: subtitle.attributes.download_count,
    imdbId: featureDetails.imdb_id,
    tmdbId: featureDetails.tmdb_id,
  };
};

export const toOpenSubtitlesSubtitleSearchResult = (
  response: OpenSubtitlesSearchResponse,
): OpenSubtitlesSubtitleSearchResult => ({
  totalPages: response.total_pages,
  totalCount: response.total_count,
  perPage: response.per_page,
  page: response.page,
  items: response.data
    .map(toSubtitleSearchItem)
    .filter(
      (item): item is OpenSubtitlesSubtitleSearchItem => item !== null,
    ),
});

export const toOpenSubtitlesDownloadResult = (
  response: OpenSubtitlesDownloadResponse,
): OpenSubtitlesDownloadResult => ({
  url: response.link,
  fileName: response.file_name,
  requests: response.requests,
  remaining: response.remaining,
  message: response.message,
  resetTime: response.reset_time,
  resetTimeUtc: response.reset_time_utc,
});
