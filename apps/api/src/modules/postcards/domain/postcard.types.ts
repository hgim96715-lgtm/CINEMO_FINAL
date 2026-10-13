export type PostcardVisibility = "PUBLIC" | "PRIVATE" | "UNLISTED";

export type PostcardStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED";

export type PostcardType = "REVIEW" | "QUOTE" | "SCENE" | "NOTE";

export type PostcardSource = "USER" | "AI";

export type PostcardMediaType = "IMAGE" | "CAPTURE";

export type Postcard = {
  id: string;
  userId: string;
  movieId: string;
  type: PostcardType;
  source: PostcardSource;
  content: string;
  visibility: PostcardVisibility;
  status: PostcardStatus;
  backgroundStyle: string | null;
  backgroundImageKey: string | null;
  style: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
};
