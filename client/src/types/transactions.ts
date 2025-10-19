import type {
  ParsedTransaction,
  TransactionSource,
} from "@shared/schema";

export interface DailyTotals {
  income: number;
  expense: number;
  net: number;
}

export interface DailyTransactionGroup {
  source: TransactionSource;
  totals: DailyTotals;
  transactions: ParsedTransaction[];
  currencySymbol: string;
}

export interface DailySummary {
  dateKey: string;
  date: Date;
  totals: DailyTotals;
  recurringCount: number;
  transactions: ParsedTransaction[];
  groups: DailyTransactionGroup[];
  currencySymbol: string;
}
