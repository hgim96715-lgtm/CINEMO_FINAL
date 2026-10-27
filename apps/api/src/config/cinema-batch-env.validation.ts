import * as Joi from "joi";

import { EnvKeys } from "@/config/env-keys";

export const cinemaBatchEnvValidationSchema = Joi.object({
  [EnvKeys.DATABASE_URL]: Joi.string()
    .uri({ scheme: ["postgresql", "postgres"] })
    .required(),

  [EnvKeys.KAKAO_REST_API_KEY]: Joi.string()
    .trim()
    .min(1)
    .required(),
});
