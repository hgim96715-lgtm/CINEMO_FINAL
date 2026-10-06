import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const appConfig = registerAs("app", () => ({
  port: Number(process.env[EnvKeys.API_PORT] ?? 3050),
  frontendUrl: process.env[EnvKeys.FRONTEND_URL],
  apiUrl: process.env[EnvKeys.API_URL],
}));
