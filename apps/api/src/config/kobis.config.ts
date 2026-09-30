import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const kobisConfig = registerAs("kobis", () => ({
  baseUrl: process.env[EnvKeys.KOBIS_BASE_URL],
  apiKey: process.env[EnvKeys.KOBIS_API_KEY],
}));
