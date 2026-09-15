-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'CALM', 'SAD', 'ANGRY', 'ANXIOUS', 'EXCITED', 'TIRED', 'NEUTRAL');

-- AlterTable
ALTER TABLE "Container" ADD COLUMN     "moods" "Mood"[];
