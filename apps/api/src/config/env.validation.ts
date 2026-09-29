import * as Joi from "joi";

import { EnvKeys } from "./env-keys";

export const envValidationSchema = Joi.object({
  [EnvKeys.DATABASE_URL]: Joi.string()
    .uri({ scheme: ["postgresql", "postgres"] })
    .required(),

  [EnvKeys.API_PORT]: Joi.number().port().default(3050),

  [EnvKeys.FRONTEND_URL]: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
});
