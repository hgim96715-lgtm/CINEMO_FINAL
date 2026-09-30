import * as Joi from "joi";

import { EnvKeys } from "@/config/env-keys";

export const envValidationSchema = Joi.object({
  [EnvKeys.DATABASE_URL]: Joi.string()
    .uri({ scheme: ["postgresql", "postgres"] })
    .required(),

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
});
