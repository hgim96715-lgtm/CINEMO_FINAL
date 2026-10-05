import { registerAs } from "@nestjs/config";

import { EnvKeys } from "@/config/env-keys";

export const mailConfig = registerAs("mail", () => ({
  apiKey: process.env[EnvKeys.RESEND_API_KEY],
  from: process.env[EnvKeys.MAIL_FROM],
  appUrl: process.env[EnvKeys.APP_URL],
}));
