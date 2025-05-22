/*
  Warnings:

  - You are about to drop the column `customCategoryId` on the `RecurringFundAndBill` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `RecurringFundAndBill` table. All the data in the column will be lost.
  - You are about to drop the `_AccountRecurringFunds` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `RecurringFundAndBill` DROP FOREIGN KEY `RecurringFundAndBill_customCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `_AccountRecurringFunds` DROP FOREIGN KEY `_AccountRecurringFunds_A_fkey`;

-- DropForeignKey
ALTER TABLE `_AccountRecurringFunds` DROP FOREIGN KEY `_AccountRecurringFunds_B_fkey`;

-- AlterTable
ALTER TABLE `RecurringFundAndBill` DROP COLUMN `customCategoryId`,
    DROP COLUMN `startDate`;

-- DropTable
DROP TABLE `_AccountRecurringFunds`;

-- CreateTable
CREATE TABLE `RecurringBillCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recurringFundAndBillId` INTEGER NOT NULL,
    `customCategoryId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `RecurringBillCategory_recurringFundAndBillId_idx`(`recurringFundAndBillId`),
    INDEX `RecurringBillCategory_customCategoryId_idx`(`customCategoryId`),
    UNIQUE INDEX `RecurringBillCategory_recurringFundAndBillId_customCategoryI_key`(`recurringFundAndBillId`, `customCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RecurringBillCategory` ADD CONSTRAINT `RecurringBillCategory_recurringFundAndBillId_fkey` FOREIGN KEY (`recurringFundAndBillId`) REFERENCES `RecurringFundAndBill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurringBillCategory` ADD CONSTRAINT `RecurringBillCategory_customCategoryId_fkey` FOREIGN KEY (`customCategoryId`) REFERENCES `CustomCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
