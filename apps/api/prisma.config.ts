import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // Prisma CLI 마이그레이션은 Neon direct connection 사용
    url: env("DIRECT_URL"),
  },
});
