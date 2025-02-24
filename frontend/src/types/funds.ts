import { Currency } from "./currency";

export interface Fund {
    id: number;
  name: string;
  amount: string;
  currency: Currency; 
  currencyId: number;
  userId: number;
  }