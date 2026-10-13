import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const openaiConfig = registerAs("openai", () => ({
  apiKey: process.env[EnvKeys.OPENAI_API_KEY],
  model: process.env[EnvKeys.OPENAI_MODEL],
}));
