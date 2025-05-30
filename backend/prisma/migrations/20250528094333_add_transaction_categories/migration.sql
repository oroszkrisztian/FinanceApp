-- CreateTable
CREATE TABLE `TransactionCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `customCategoryId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `TransactionCategory_transactionId_idx`(`transactionId`),
    INDEX `TransactionCategory_customCategoryId_idx`(`customCategoryId`),
    UNIQUE INDEX `TransactionCategory_transactionId_customCategoryId_key`(`transactionId`, `customCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TransactionCategory` ADD CONSTRAINT `TransactionCategory_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionCategory` ADD CONSTRAINT `TransactionCategory_customCategoryId_fkey` FOREIGN KEY (`customCategoryId`) REFERENCES `CustomCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
