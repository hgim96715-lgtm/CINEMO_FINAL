FROM node:22-bookworm-slim AS build

WORKDIR /app

RUN npm install --global pnpm@10

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/api-contract/package.json packages/api-contract/package.json
COPY packages/shared/package.json packages/shared/package.json


RUN pnpm install --frozen-lockfile


COPY apps/api apps/api
COPY packages packages


# Prisma generate용 임시 URL. 실제 DB에 연결하지 않음
ENV DATABASE_URL=postgresql://localhost:5432/cinemo
ENV DIRECT_URL=postgresql://localhost:5432/cinemo

RUN pnpm --filter @cinemo/api prisma:generate
RUN pnpm --filter @cinemo/api build


FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist

EXPOSE 8080

CMD ["node", "apps/api/dist/main.js"]
