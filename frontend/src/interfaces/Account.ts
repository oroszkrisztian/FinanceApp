import { AccountType, CurrencyType } from "./enums";
import { RecurringFundAndBill } from "./RecurringFundAndBill";
import { SavingAccount } from "./SavingAccount";
import { Transaction } from "./Transaction";
import { User } from "./User";


export interface Account {
  id: number;
  name: string;
  description?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  deletedAt?: Date;
  type: AccountType;
  currency: CurrencyType;
  savingAccount?: SavingAccount;
  user: User;
  transactionsFrom: Transaction[];
  transactionsTo: Transaction[];
  recurringFundsAndBills: RecurringFundAndBill[];
}