import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const tmdbConfig = registerAs("tmdb", () => ({
  accessToken: process.env[EnvKeys.TMDB_ACCESS_TOKEN],
  baseUrl: process.env[EnvKeys.TMDB_BASE_URL],
}));
