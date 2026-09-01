-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleReviewUrl" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reviewComment" TEXT,
ADD COLUMN     "reviewRating" INTEGER,
ADD COLUMN     "reviewRequestedAt" TIMESTAMP(3),
ADD COLUMN     "reviewToken" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- Backfill: reviewToken é obrigatório e único, mas o default (@default(uuid()))
-- só existe do lado do Prisma Client, não do banco — sem preencher as linhas
-- que já existem antes, o ALTER COLUMN ... SET NOT NULL abaixo falharia.
UPDATE "Booking" SET "reviewToken" = gen_random_uuid()::text WHERE "reviewToken" IS NULL;

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "reviewToken" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reviewToken_key" ON "Booking"("reviewToken");

-- CreateIndex
CREATE INDEX "Booking_status_reviewRequestedAt_idx" ON "Booking"("status", "reviewRequestedAt");
