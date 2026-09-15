/*
  Warnings:

  - Added the required column `status` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "status" "ProjectStatus" NOT NULL;
