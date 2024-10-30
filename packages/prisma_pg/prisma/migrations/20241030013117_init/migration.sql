/*
  Warnings:

  - You are about to drop the `ExecutedSignal` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ExecutedSignal" DROP CONSTRAINT "ExecutedSignal_signal_id_fkey";

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "signal_updated_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "ExecutedSignal";
