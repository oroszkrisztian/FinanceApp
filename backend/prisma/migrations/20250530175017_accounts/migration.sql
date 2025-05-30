-- CreateTable
CREATE TABLE `AccountBalanceHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `accountId` INTEGER NOT NULL,
    `transactionId` INTEGER NULL,
    `previousBalance` DOUBLE NOT NULL,
    `newBalance` DOUBLE NOT NULL,
    `amountChanged` DOUBLE NOT NULL,
    `changeType` ENUM('TRANSACTION_INCOME', 'TRANSACTION_EXPENSE', 'TRANSACTION_TRANSFER_IN', 'TRANSACTION_TRANSFER_OUT', 'MANUAL_ADJUSTMENT', 'INTEREST_EARNED', 'FEE_CHARGED', 'CORRECTION') NOT NULL,
    `description` VARCHAR(191) NULL,
    `currency` ENUM('RON', 'HUF', 'EUR', 'USD', 'GBP', 'CHF', 'AED', 'AUD', 'BGN', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EGP', 'HKD', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MDL', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RSD', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'UAH', 'XAU', 'XDR', 'ZAR') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AccountBalanceHistory_accountId_idx`(`accountId`),
    INDEX `AccountBalanceHistory_transactionId_idx`(`transactionId`),
    INDEX `AccountBalanceHistory_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccountBalanceHistory` ADD CONSTRAINT `AccountBalanceHistory_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountBalanceHistory` ADD CONSTRAINT `AccountBalanceHistory_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
