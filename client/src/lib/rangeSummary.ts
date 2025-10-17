import type { ParsedTransaction, TransactionCategory } from "@shared/schema";
import {
  DEFAULT_CURRENCY_SYMBOL,
  getLocalDateKey,
  resolveTransactionSource,
} from "@/lib/transactionUtils";

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

const toStartOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const toEndOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

const normalizeRange = (range: DateRange): DateRange => {
  const start = toStartOfDay(range.start);
  const end = toEndOfDay(range.end);
  if (start.getTime() <= end.getTime()) {
    return { start, end };
  }
  return { start: toStartOfDay(range.end), end: toEndOfDay(range.start) };
};

export const filterTransactionsInRange = (
  transactions: ParsedTransaction[],
  range: DateRange | null
): ParsedTransaction[] => {
  if (!range) {
    return [];
  }

  const { start, end } = normalizeRange(range);

  return transactions.filter((transaction) => {
    const timestamp = transaction.date.getTime();
    return timestamp >= start.getTime() && timestamp <= end.getTime();
  });
};

const getDayCount = (range: DateRange): number => {
  const start = toStartOfDay(range.start).getTime();
  const end = toStartOfDay(range.end).getTime();
  const diff = end - start;
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
};

const formatRangeLabel = ({ start, end }: DateRange): string => {
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return start.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameYear && sameMonth) {
    const month = start.toLocaleDateString("en-US", { month: "long" });
    return `${month} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }

  if (sameYear) {
    const startLabel = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endLabel = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startLabel} – ${endLabel}`;
  }

  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
};

const toRankedList = (
  entries: Record<string, RankedEntity>
): RankedEntity[] =>
  Object.values(entries)
    .sort((a, b) => {
      const diff = Math.abs(b.total) - Math.abs(a.total);
      if (diff !== 0) {
        return diff;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 3);

const aggregateByMerchant = (
  transactions: ParsedTransaction[]
): RankedEntity[] => {
  const groups: Record<string, RankedEntity> = {};

  transactions.forEach((transaction) => {
    const source = resolveTransactionSource(transaction);
    const key = source.name || "Unknown";
    if (!groups[key]) {
      groups[key] = { name: key, total: 0, count: 0 };
    }
    groups[key].total += transaction.amount;
    groups[key].count += 1;
  });

  return toRankedList(groups);
};

const aggregateByCategory = (
  transactions: ParsedTransaction[]
): CategoryBreakdown[] => {
  const groups: Record<string, CategoryBreakdown> = {};

  transactions.forEach((transaction) => {
    const key = transaction.category;
    if (!groups[key]) {
      groups[key] = {
        name: key,
        category: transaction.category,
        total: 0,
        count: 0,
      };
    }
    groups[key].total += transaction.amount;
    groups[key].count += 1;
  });

  return Object.values(groups)
    .sort((a, b) => {
      const diff = Math.abs(b.total) - Math.abs(a.total);
      if (diff !== 0) {
        return diff;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 3);
};

export const buildRangeSummary = (
  transactions: ParsedTransaction[],
  range: DateRange
): RangeSummary => {
  const normalizedRange = normalizeRange(range);
  const dayCount = getDayCount(normalizedRange);
  const transactionCount = transactions.length;

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((transaction) => {
    if (transaction.amount >= 0) {
      totalIncome += transaction.amount;
    } else {
      totalExpense += transaction.amount;
    }
  });

  const netTotal = totalIncome + totalExpense;
  const dailyAverage = dayCount > 0 ? netTotal / dayCount : 0;
  const currencySymbol =
    transactions[0]?.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;

  const topMerchants = aggregateByMerchant(transactions);
  const topCategories = aggregateByCategory(transactions);
  const largestTransaction = transactions.reduce<ParsedTransaction | null>(
    (largest, current) => {
      if (!largest) {
        return current;
      }
      return Math.abs(current.amount) > Math.abs(largest.amount)
        ? current
        : largest;
    },
    null
  );

  return {
    range: normalizedRange,
    rangeLabel: formatRangeLabel(normalizedRange),
    dayCount,
    transactionCount,
    totalIncome,
    totalExpense,
    netTotal,
    dailyAverage,
    currencySymbol,
    topMerchants,
    topCategories,
    largestTransaction,
  };
};

const escapeCsvValue = (value: string) =>
  `"${value.replace(/"/g, '""')}"`;

export const buildRangeCsv = (
  transactions: ParsedTransaction[]
): string => {
  const header = "Date,Description,Amount,Category,Source";

  const rows = transactions.map((transaction) => {
    const date = getLocalDateKey(transaction.date);
    const description = transaction.description ?? "";
    const amount = transaction.amount.toFixed(2);
    const category = transaction.category;
    const source = resolveTransactionSource(transaction).name ?? "";

    return [date, description, amount, category, source]
      .map((value) => escapeCsvValue(String(value)))
      .join(",");
  });

  return [header, ...rows].join("\n");
};
