import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const databaseConfig = registerAs("database", () => ({
  url: process.env[EnvKeys.DATABASE_URL],
}));
