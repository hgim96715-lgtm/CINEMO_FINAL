import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const kmdbConfig = registerAs("kmdb", () => ({
  apiKey: process.env[EnvKeys.KMDB_API_KEY],
  baseUrl: process.env[EnvKeys.KMDB_BASE_URL],
}));
