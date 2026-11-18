import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, env } from "prisma/config";

config({
  // CLI를 저장소 루트에서 실행해도 API 전용 DB 연결을 사용한다.
  path: resolve(dirname(fileURLToPath(import.meta.url)), ".env"),
  override: true,
});

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
