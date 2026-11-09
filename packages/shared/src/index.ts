export type MovieId = string;

export { CINEMO_COLORS } from "./theme/colors";
export type { CinemoColor } from "./theme/colors";
export { CINEMO_BRAND } from "./theme/brand";
export {
  CINEMA_REGION_COLORS,
  CINEMA_REGION_LABELS,
  GEO_CODE_TO_CINEMA_REGION_CODE,
  INTEGRATED_GWANGJU_JEONNAM_CODE,
  INTEGRATED_GWANGJU_JEONNAM_CODES,
  normalizeCinemaRegionCode,
} from "./cinema-regions";
export type { CinemaRegion } from "./cinema-regions";
export { DEFAULT_DAILY_MOVIE_PUSH, formatDailyMoviePush, formatDailyMovieSchedule } from "./daily-movie-push";
export type { DailyMoviePushSettings } from "./daily-movie-push";
export { CINEMO_LEGAL_DOCUMENTS } from "./legal-documents";
export type { CinemoLegalDocument } from "./legal-documents";
