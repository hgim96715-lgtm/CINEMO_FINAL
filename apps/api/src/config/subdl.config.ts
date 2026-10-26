import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const subdlConfig = registerAs("subdl", () => ({
  baseUrl:
    process.env[EnvKeys.SUBDL_API_BASE_URL] ?? "https://api.subdl.com/api/v1",
  apiKey: process.env[EnvKeys.SUBDL_API_KEY],
}));
