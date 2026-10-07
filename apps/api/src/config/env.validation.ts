import * as Joi from "joi";

import { EnvKeys } from "@/config/env-keys";

export const envValidationSchema = Joi.object({
  [EnvKeys.DATABASE_URL]: Joi.string()
    .uri({ scheme: ["postgresql", "postgres"] })
    .required(),
  [EnvKeys.DIRECT_URL]: Joi.string().uri({
    scheme: ["postgresql", "postgres"],
  }),

  [EnvKeys.API_PORT]: Joi.number().port().default(3050),

  [EnvKeys.FRONTEND_URL]: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),

  [EnvKeys.KOBIS_BASE_URL]: Joi.string()
    .uri({ allowRelative: false })
    .required(),
  [EnvKeys.KOBIS_API_KEY]: Joi.string().trim().min(1).required(),

  [EnvKeys.TMDB_ACCESS_TOKEN]: Joi.string().trim().min(1).required(),
  [EnvKeys.TMDB_BASE_URL]: Joi.string()
    .uri({ allowRelative: false })
    .required(),

  [EnvKeys.KMDB_API_KEY]: Joi.string().trim().min(1).required(),
  [EnvKeys.KMDB_BASE_URL]: Joi.string()
    .uri({ allowRelative: false })
    .required(),
  [EnvKeys.API_URL]: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
  [EnvKeys.RESEND_API_KEY]: Joi.string().trim().min(1).required(),
  [EnvKeys.MAIL_FROM]: Joi.string().trim().min(1).required(),

  [EnvKeys.GOOGLE_CLIENT_ID]: Joi.string().trim().min(1).required(),
  [EnvKeys.GOOGLE_CLIENT_SECRET]: Joi.string().trim().min(1).required(),
  [EnvKeys.GOOGLE_CALLBACK_URL]: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),

  [EnvKeys.APPLE_CLIENT_ID]: Joi.string().trim().min(1).required(),
  [EnvKeys.APPLE_TEAM_ID]: Joi.string().trim().min(1).required(),
  [EnvKeys.APPLE_KEY_ID]: Joi.string().trim().min(1).required(),
  [EnvKeys.APPLE_PRIVATE_KEY]: Joi.string().trim().min(1).required(),
  [EnvKeys.APPLE_CALLBACK_URL]: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),

  [EnvKeys.NAVER_CLIENT_ID]: Joi.string().trim().min(1).required(),
  [EnvKeys.NAVER_CLIENT_SECRET]: Joi.string().trim().min(1).required(),
  [EnvKeys.NAVER_CALLBACK_URL]: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
});
