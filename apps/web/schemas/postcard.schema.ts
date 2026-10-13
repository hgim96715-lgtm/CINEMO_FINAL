import { z } from "zod";

const styleSchema = z.object({
  backgroundType: z.enum(["POSTER", "SOLID", "GRADIENT", "IMAGE"]),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  textAlign: z.enum(["LEFT", "CENTER", "RIGHT"]).optional(),
});

const mediaSchema = z.object({
  type: z.literal("IMAGE"),
  url: z.url().nullable().optional(),
  storageKey: z.string().max(512).nullable().optional(),
  altText: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

const postcardTranslationSchema = z.object({
  language: z.string().trim().min(2).max(20),
  content: z.string().trim().min(1).max(5000),
  source: z.enum(["AI", "USER"]),
});

const commonFields = {
  movieId: z.uuidv7(),
  content: z
    .string()
    .trim()
    .min(1, "엽서 내용을 입력해야 합니다.")
    .max(5000, "엽서 내용은 5,000자 이하로 입력해야 합니다."),
  quoteSource: z.enum(["USER", "OPENSUBTITLES"]).nullable().optional(),
  style: styleSchema.nullable().optional(),
  media: z.array(mediaSchema).max(4).optional(),
  backgroundStyle: z.string().max(100).nullable().optional(),
  backgroundImageKey: z.string().max(255).nullable().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]),
};

export const createPostcardSchema = z.discriminatedUnion("type", [
  z.object({
    ...commonFields,
    type: z.literal("REVIEW"),
    metadata: z
      .object({
        type: z.literal("REVIEW"),
        title: z.string().max(200).nullable().optional(),
      })
      .nullable()
      .optional(),
  }),

  z.object({
    ...commonFields,
    type: z.literal("QUOTE"),
    metadata: z
      .object({
        type: z.literal("QUOTE"),
        title: z.string().max(200).nullable().optional(),
        originalLanguage: z.string().max(20).nullable().optional(),
        translations: z
          .array(postcardTranslationSchema)
          .max(5)
          .nullable()
          .optional(),
        isAiSuggested: z.boolean().optional(),
      })
      .nullable()
      .optional(),
  }),

  z.object({
    ...commonFields,
    type: z.literal("SCENE"),
    metadata: z
      .object({
        type: z.literal("SCENE"),
        sceneDescription: z.string().max(1000).nullable().optional(),
        sceneTime: z.string().max(20).nullable().optional(),
      })
      .nullable()
      .optional(),
  }),

  z.object({
    ...commonFields,
    type: z.literal("NOTE"),
    metadata: z
      .object({
        type: z.literal("NOTE"),
        venueType: z.enum(["HOME", "THEATER", "OTHER"]).nullable().optional(),
        venueName: z.string().max(100).nullable().optional(),
        companionType: z
          .enum(["ALONE", "FRIEND", "FAMILY", "PARTNER", "OTHER"])
          .nullable()
          .optional(),
        companionName: z.string().max(100).nullable().optional(),
        watchedAt: z.string().max(10).nullable().optional(),
      })
      .nullable()
      .optional(),
  }),
]);

export type CreatePostcardFormValues = z.infer<typeof createPostcardSchema>;
