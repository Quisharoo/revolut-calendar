export type TransactionCategory = "Income" | "Expense" | "Transfer";

export type TransactionSourceType =
  | "broker"
  | "merchant"
  | "account"
  | "platform"
  | "unknown";

export interface TransactionSource {
  name: string;
  type: TransactionSourceType;
  identifier?: string;
}

export interface ParsedTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  currencySymbol?: string;
  category: TransactionCategory;
  /**
   * Legacy field kept for compatibility with earlier mock data and filters.
   * Prefer using `source` for new code.
   */
  broker?: string;
  source?: TransactionSource;
  isRecurring: boolean;
}
