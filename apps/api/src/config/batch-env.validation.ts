import * as Joi from "joi";

import { EnvKeys } from "@/config/env-keys";

export const batchEnvValidationSchema = Joi.object({
  [EnvKeys.KAKAO_REST_API_KEY]: Joi.string().trim().min(1).required(),
  [EnvKeys.DATABASE_URL]: Joi.string()
    .uri({ scheme: ["postgresql", "postgres"] })
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

  [EnvKeys.RESEND_API_KEY]: Joi.string().trim().min(1).required(),
  [EnvKeys.MAIL_FROM]: Joi.string().trim().min(1).required(),
  [EnvKeys.FRONTEND_URL]: Joi.string().uri({ allowRelative: false }).required(),
  [EnvKeys.API_URL]: Joi.string().uri({ allowRelative: false }).required(),
});
