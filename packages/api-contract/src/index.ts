export type HealthResponse = {
  status: "ok";
};
export type {
  MovieSearchItemResponseDto as MovieSearchItemResponse,
  MovieSearchResponseDto as MovieSearchResponse,
  MovieResponseDto as MovieResponse,
  SearchTmdbMoviesResponseDto as SearchTmdbMoviesResponse,
  UserMovieRecordResponseDto as UserMovieRecordResponse,
  UpdateMovieRecordRequestDto as UpdateMovieRecordRequest,
} from "./generated/types.gen";

export type {
  CreatePostcardRequestDto as CreatePostcardRequest,
  PostcardFeedResponseDto as PostcardFeedResponse,
  PostcardMediaDto as PostcardMedia,
  PostcardMetadataDto as PostcardMetadata,
  PostcardResponseDto as PostcardResponse,
  PostcardStyleDto as PostcardStyle,
  UpdatePostcardRequestDto as UpdatePostcardRequest,
} from "./generated/types.gen";
