-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- Keep historical consumed, revoked, and expired tokens inactive.
UPDATE "RefreshToken"
SET "status" = false
WHERE "usedAt" IS NOT NULL OR "revokedAt" IS NOT NULL OR "expiresAt" <= CURRENT_TIMESTAMP;
