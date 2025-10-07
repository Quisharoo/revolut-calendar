export type TransactionCategory = "Income" | "Expense" | "Transfer";

export interface ParsedTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: TransactionCategory;
  broker?: string;
  isRecurring: boolean;
}
