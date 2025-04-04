/*
  Warnings:

  - You are about to drop the column `customCategoryId` on the `Budget` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Budget` DROP FOREIGN KEY `Budget_customCategoryId_fkey`;

-- AlterTable
ALTER TABLE `Budget` DROP COLUMN `customCategoryId`;

-- CreateTable
CREATE TABLE `BudgetCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `budgetId` INTEGER NOT NULL,
    `customCategoryId` INTEGER NOT NULL,

    INDEX `BudgetCategory_budgetId_idx`(`budgetId`),
    INDEX `BudgetCategory_customCategoryId_idx`(`customCategoryId`),
    UNIQUE INDEX `BudgetCategory_budgetId_customCategoryId_key`(`budgetId`, `customCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BudgetCategory` ADD CONSTRAINT `BudgetCategory_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `Budget`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BudgetCategory` ADD CONSTRAINT `BudgetCategory_customCategoryId_fkey` FOREIGN KEY (`customCategoryId`) REFERENCES `CustomCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
