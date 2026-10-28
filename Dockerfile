FROM node:22-bookworm-slim AS build

WORKDIR /app

# 빌드 단계에서는 Nest CLI·TypeScript 같은 devDependency가 필요함
ENV NODE_ENV=development
ENV CI=true

RUN npm install --global \
  pnpm@11.21.0 \
  @nestjs/cli@11.0.24 \
  typescript@5.9.3

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/api-contract/package.json packages/api-contract/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY patches patches


# Nest CLI와 TypeScript는 API build 단계의 devDependency이므로 반드시 설치
# Docker Desktop/npm registry의 동시 다운로드 오류를 줄이고 재시도 횟수를 확보함
RUN pnpm config set network-concurrency 4 \
  && pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-timeout 120000 \
  && pnpm install --frozen-lockfile --prod=false --shamefully-hoist


COPY apps/api apps/api
COPY packages packages


# Prisma generate용 임시 URL. 실제 DB에 연결하지 않음
ENV DATABASE_URL=postgresql://localhost:5432/cinemo
ENV DIRECT_URL=postgresql://localhost:5432/cinemo

RUN pnpm --filter @cinemo/api prisma:generate
RUN cd /app/apps/api && nest build


FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
