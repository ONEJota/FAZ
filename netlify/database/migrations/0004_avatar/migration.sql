-- Avatar personalizado e boas-vindas no primeiro acesso
ALTER TABLE "User" ADD COLUMN "avatarStyle" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarSeed" TEXT;
ALTER TABLE "User" ADD COLUMN "avatarBg" TEXT;
ALTER TABLE "User" ADD COLUMN "statusEmoji" TEXT;
ALTER TABLE "User" ADD COLUMN "onboardedAt" TIMESTAMP(3);
