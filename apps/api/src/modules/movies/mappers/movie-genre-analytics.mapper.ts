import { GetMovieGenreAnalyticsRequestDto } from "../dto/requests/get-movie-genre-analytics.request.dto";

export type MovieGenreDateRange = {
  startDate: Date;
  endDate: Date;
};

export function toMovieGenreDateRange(
  query: GetMovieGenreAnalyticsRequestDto,
): MovieGenreDateRange {
  return {
    startDate: new Date(Date.UTC(query.year, query.month - 1, 1)),
    endDate: new Date(Date.UTC(query.year, query.month, 1)),
  };
}
