-- CreateEnum
CREATE TYPE "UserVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_visibility" "UserVisibility" NOT NULL DEFAULT 'PUBLIC';
