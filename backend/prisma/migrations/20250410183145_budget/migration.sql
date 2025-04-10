/*
  Warnings:

  - You are about to drop the column `customCategoryId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `_BudgetToTransaction` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `BudgetCategory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Transaction` DROP FOREIGN KEY `Transaction_customCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `_BudgetToTransaction` DROP FOREIGN KEY `_BudgetToTransaction_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BudgetToTransaction` DROP FOREIGN KEY `_BudgetToTransaction_B_fkey`;

-- DropIndex
DROP INDEX `BudgetCategory_budgetId_customCategoryId_key` ON `BudgetCategory`;

-- AlterTable
ALTER TABLE `BudgetCategory` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Transaction` DROP COLUMN `customCategoryId`,
    ADD COLUMN `budgetId` INTEGER NULL;

-- DropTable
DROP TABLE `_BudgetToTransaction`;

-- CreateIndex
CREATE INDEX `Transaction_budgetId_idx` ON `Transaction`(`budgetId`);

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `Budget`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
