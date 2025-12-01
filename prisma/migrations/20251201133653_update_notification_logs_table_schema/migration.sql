/*
  Warnings:

  - You are about to drop the column `tableName` on the `notification_logs_table` table. All the data in the column will be lost.
  - Added the required column `table_name` to the `notification_logs_table` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "notification_logs_table_tableName_idx";

-- AlterTable
ALTER TABLE "notification_logs_table" DROP COLUMN "tableName",
ADD COLUMN     "table_name" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE INDEX "notification_logs_table_table_name_idx" ON "notification_logs_table"("table_name");
