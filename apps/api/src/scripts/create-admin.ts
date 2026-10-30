import "dotenv/config";

import argon2 from "argon2";
import { PrismaClient, UserStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const nickname = process.env.ADMIN_NICKNAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!databaseUrl || !email || !nickname || !password) {
  throw new Error(
    "DATABASE_URL, ADMIN_EMAIL, ADMIN_NICKNAME, ADMIN_PASSWORD가 필요함",
  );
}

if (password.length < 8) {
  throw new Error("ADMIN_PASSWORD는 8자 이상이어야 함");
}

const requiredDatabaseUrl = databaseUrl;
const requiredEmail = email;
const requiredNickname = nickname;
const requiredPassword = password;

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: requiredDatabaseUrl }),
});

async function main() {
  const passwordHash = await argon2.hash(requiredPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: requiredEmail },
    select: { id: true },
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isAdmin: true,
          status: UserStatus.ACTIVE,
          passwordCredential: {
            upsert: {
              create: { passwordHash, emailVerifiedAt: new Date() },
              update: { passwordHash, emailVerifiedAt: new Date() },
            },
          },
        },
        select: { id: true, email: true, nickname: true },
      })
    : await prisma.user.create({
        data: {
          email: requiredEmail,
          nickname: requiredNickname,
          status: UserStatus.ACTIVE,
          isAdmin: true,
          passwordCredential: {
            create: { passwordHash, emailVerifiedAt: new Date() },
          },
        },
        select: { id: true, email: true, nickname: true },
      });

  console.log(`관리자 계정 준비 완료: ${user.email} (${user.nickname})`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
