-- AlterTable
ALTER TABLE `Account` MODIFY `currency` ENUM('RON', 'HUF', 'EUR', 'USD', 'GBP', 'CHF', 'AED', 'AUD', 'BGN', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EGP', 'HKD', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MDL', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RSD', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'UAH', 'XAU', 'XDR', 'ZAR') NOT NULL;

-- AlterTable
ALTER TABLE `Budget` MODIFY `currency` ENUM('RON', 'HUF', 'EUR', 'USD', 'GBP', 'CHF', 'AED', 'AUD', 'BGN', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EGP', 'HKD', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MDL', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RSD', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'UAH', 'XAU', 'XDR', 'ZAR') NOT NULL;

-- AlterTable
ALTER TABLE `RecurringFundAndBill` MODIFY `currency` ENUM('RON', 'HUF', 'EUR', 'USD', 'GBP', 'CHF', 'AED', 'AUD', 'BGN', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EGP', 'HKD', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MDL', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RSD', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'UAH', 'XAU', 'XDR', 'ZAR') NOT NULL;

-- AlterTable
ALTER TABLE `Transaction` MODIFY `currency` ENUM('RON', 'HUF', 'EUR', 'USD', 'GBP', 'CHF', 'AED', 'AUD', 'BGN', 'BRL', 'CAD', 'CNY', 'CZK', 'DKK', 'EGP', 'HKD', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MDL', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'RSD', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'UAH', 'XAU', 'XDR', 'ZAR') NOT NULL;
