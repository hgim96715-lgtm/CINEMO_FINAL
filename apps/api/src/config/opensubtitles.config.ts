import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const openSubtitlesConfig = registerAs("opensubtitles", () => ({
  baseUrl: process.env[EnvKeys.OPENSUBTITLES_API_BASE_URL],
  userAgent: process.env[EnvKeys.OPENSUBTITLES_USER_AGENT],
  apiKey: process.env[EnvKeys.OPENSUBTITLES_API_KEY],
}));
