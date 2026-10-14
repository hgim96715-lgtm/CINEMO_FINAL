export type PostcardVisibility = "PUBLIC" | "PRIVATE";

export type PostcardStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";

export type PostcardType = "REVIEW" | "QUOTE" | "SCENE";

export type PostcardSource = "USER" | "AI";

export type PostcardQuoteSource = "USER" | "OPENSUBTITLES";

export type PostcardMediaType = "IMAGE";

export type PostcardMovieSummary = {
  id: string;
  title: string;
  posterUrl: string | null;
};

export type PostcardAuthorSummary = {
  nickname: string;
};

export type PostcardMediaSummary = {
  id: string;
  type: PostcardMediaType;
  url: string | null;
  storageKey: string | null;
  altText: string | null;
  sortOrder: number;
};

export type Postcard = {
  id: string;
  userId: string;
  movieId: string;
  movie: PostcardMovieSummary | null;
  author: PostcardAuthorSummary | null;
  media: PostcardMediaSummary[];
  type: PostcardType;
  source: PostcardSource;
  quoteSource: PostcardQuoteSource | null;
  content: string;
  visibility: PostcardVisibility;
  status: PostcardStatus;
  backgroundStyle: string | null;
  backgroundImageKey: string | null;
  style: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  reactionCount: number;
  hasReacted: boolean;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
};
