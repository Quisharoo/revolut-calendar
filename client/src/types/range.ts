import type {
  ParsedTransaction,
  TransactionCategory,
} from "@shared/schema";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RankedEntity {
  name: string;
  total: number;
  count: number;
}

export interface CategoryBreakdown extends RankedEntity {
  category: TransactionCategory;
}

export interface RangeSummary {
  range: DateRange;
  rangeLabel: string;
  dayCount: number;
  transactionCount: number;
  totalIncome: number;
  totalExpense: number;
  netTotal: number;
  dailyAverage: number;
  currencySymbol: string;
  topMerchants: RankedEntity[];
  topCategories: CategoryBreakdown[];
  largestTransaction: ParsedTransaction | null;
}
