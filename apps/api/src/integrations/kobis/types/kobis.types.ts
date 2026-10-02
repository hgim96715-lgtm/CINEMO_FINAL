export interface KobisMovieListResponse {
  movieListResult: {
    totCnt: number;
    source: string;
    movieList: KobisMovie[];
  };
}

export interface KobisMovieBase {
  movieCd: string;
  movieNm: string;
  movieNmEn?: string;
  prdtYear?: string;
  openDt?: string;
  typeNm?: string;
  prdtStatNm?: string;
}

export interface KobisMovie extends KobisMovieBase {
  nationAlt?: string;
  genreAlt?: string;
  repNationNm?: string;
  repGenreNm?: string;
  directors?: KobisDirector[];
  companys?: KobisCompany[];
}

export interface KobisDirector {
  peopleNm: string;
  peopleNmEn?: string;
}

export interface KobisCompany {
  companyCd?: string;
  companyNm?: string;
  companyNmEn?: string;
}

export interface KobisMovieInfoResponse {
  movieInfoResult: {
    movieInfo: KobisMovieInfo;
  };
}

export interface KobisMovieInfo extends KobisMovieBase {
  movieNmOg?: string;
  showTm?: string;

  nations?: KobisNation[];
  genres?: KobisGenre[];
  directors?: KobisDirector[];
  actors?: KobisActor[];
  companies?: KobisCompany[];
  audits?: KobisAudit[];
}

export interface KobisNation {
  nationNm: string;
}

export interface KobisGenre {
  genreNm: string;
}

export interface KobisDirector {
  peopleNm: string;
  peopleNmEn?: string;
}
export interface KobisActor {
  peopleNm: string;
  peopleNmEn?: string;
  cast?: string;
  castEn?: string;
}

export interface KobisCompany {
  companyCd?: string;
  companyNm?: string;
  companyNmEn?: string;
  companyPartNm?: string;
}

export interface KobisAudit {
  auditNo: string;
  watchGradeNm: string;
}

export interface KobisDailyBoxOfficeMovie {
  rank: string;
  movieCd: string;
  movieNm: string;
  openDt?: string;

  audiCnt: string;
  audiAcc: string;
  audiInten: string;
  audiChange: string;
  audiIntenAcc: string;
  audiChangeAcc: string;
}

export interface KobisDailyBoxOfficeResponse {
  boxOfficeResult: {
    dailyBoxOfficeList: KobisDailyBoxOfficeMovie[];
  };
}
