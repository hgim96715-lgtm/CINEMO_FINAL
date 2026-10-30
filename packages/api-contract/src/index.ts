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
  CreatePostcardCommentRequestDto as CreatePostcardCommentRequest,
  CreatePostcardRequestDto as CreatePostcardRequest,
  PostcardFeedResponseDto as PostcardFeedResponse,
  PostcardCommentResponseDto as PostcardCommentResponse,
  PostcardMediaDto as PostcardMedia,
  PostcardMetadataDto as PostcardMetadata,
  PostcardResponseDto as PostcardResponse,
  PostcardStyleDto as PostcardStyle,
  UpdatePostcardRequestDto as UpdatePostcardRequest,
} from "./generated/types.gen";

export type UnifiedSearchPerson = {
  id: string;
  name: string;
  nameEn: string | null;
  profileUrl: string | null;
  roles: Array<"DIRECTOR" | "ACTOR">;
};

export type UnifiedSearchGenre = {
  name: string;
  count: number;
};

export type UnifiedSearchResponse = {
  movies: import("./generated/types.gen").MovieSearchItemResponseDto[];
  people: UnifiedSearchPerson[];
  genres: UnifiedSearchGenre[];
};
