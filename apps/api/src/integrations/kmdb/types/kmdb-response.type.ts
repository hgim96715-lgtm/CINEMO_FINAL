export interface KmdbSearchResponse {
  Query?: string;
  KMAQuery?: string;
  TotalCount?: number;
  Data?: KmdbSearchData[];
}

export interface KmdbSearchData {
  CollName?: string;
  TotalCount?: number;
  Count?: number;
  Result?: KmdbMovieResult[];
}

export interface KmdbMovieResult {
  DOCID: string;
  movieId?: string;
  movieSeq?: string;
  title?: string;
  titleEng?: string;
  titleOrg?: string;
  titleEtc?: string;
  prodYear?: string;
  nation?: string;
  company?: string;
  runtime?: string;
  rating?: string;
  genre?: string;
  kmdbUrl?: string;
  directors?: {
    director?: KmdbPerson[];
  };
  actors?: {
    actor?: KmdbPerson[];
  };
  plots?: {
    plot?: KmdbPlot[];
  };
  posters?: string | string[];
  vods?: {
    vod?: KmdbVod[];
  };
  ratings?: {
    rating?: KmdbRating[];
  };
}
export interface KmdbPerson {
  directorNm?: string;
  directorEnNm?: string;
  directorId?: string;
  actorNm?: string;
  actorEnNm?: string;
  actorId?: string;
}

export interface KmdbPlot {
  plotLang?: string;
  plotText?: string;
}

export interface KmdbVod {
  vodClass?: string;
  vodUrl?: string;
}

export interface KmdbRating {
  ratingMain?: string;
  ratingDate?: string;
  ratingNo?: string;
  ratingGrade?: string;
  releaseDate?: string;
  runtime?: string;
}
