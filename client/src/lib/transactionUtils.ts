import type {
  ParsedTransaction,
  TransactionSource,
  TransactionSourceType,
} from "@shared/schema";

export interface DailyTotals {
  income: number;
  expense: number;
  transfer: number;
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

export const DEFAULT_CURRENCY_SYMBOL = "$";

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case "Income":
      return "text-primary";
    case "Expense":
      return "text-destructive";
    case "Transfer":
      // Transfer category exists in schema but is hidden in UI
      // Components should handle transfer display logic before calling this
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
};

export const getCategoryBgColor = (category: string): string => {
  switch (category) {
    case "Income":
      return "bg-primary/10";
    case "Expense":
      return "bg-destructive/10";
    case "Transfer":
      // Transfer category exists in schema but is hidden in UI
      // Components should handle transfer display logic before calling this
      return "bg-muted/50";
    default:
      return "bg-accent";
  }
};

export const getCategoryDotColor = (category: string): string => {
  switch (category) {
    case "Income":
      return "bg-primary";
    case "Expense":
      return "bg-destructive";
    case "Transfer":
      // Transfer category exists in schema but is hidden in UI
      // Components should handle transfer display logic before calling this
      return "bg-muted-foreground";
    default:
      return "bg-foreground";
  }
};

export const formatCurrency = (
  amount: number,
  currencySymbol: string = DEFAULT_CURRENCY_SYMBOL
): string => {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount >= 0 ? `+${currencySymbol}${formatted}` : `-${currencySymbol}${formatted}`;
};

export const groupTransactionsByDate = (
  transactions: ParsedTransaction[]
): Map<string, ParsedTransaction[]> => {
  const grouped = new Map<string, ParsedTransaction[]>();
  summarizeTransactionsByDate(transactions).forEach((summary, dateKey) => {
    grouped.set(dateKey, summary.transactions);
  });
  return grouped;
};

const SOURCE_TYPE_BY_KEYWORD: Array<{ keyword: string; type: TransactionSourceType }> = [
  { keyword: "broker", type: "broker" },
  { keyword: "merchant", type: "merchant" },
  { keyword: "counterparty", type: "merchant" },
  { keyword: "account", type: "account" },
  { keyword: "card", type: "account" },
  { keyword: "platform", type: "platform" },
];

const defaultSource: TransactionSource = {
  name: "Uncategorised",
  type: "unknown",
};

const cloneDateWithoutTime = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Creates a date key from a Date object using local timezone.
 * This avoids timezone-related shifts when grouping transactions by day.
 * @param date The date to convert to a key
 * @returns A string in format YYYY-MM-DD based on local date components
 */
export const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const applyAmountToTotals = (totals: DailyTotals, transaction: ParsedTransaction) => {
  if (transaction.category === "Income") {
    totals.income += transaction.amount;
  } else if (transaction.category === "Expense") {
    totals.expense += transaction.amount;
  } else {
    totals.transfer += transaction.amount;
  }
  totals.net = totals.income + totals.expense + totals.transfer;
};

const totalsMagnitude = (totals: DailyTotals) =>
  Math.abs(totals.income) + Math.abs(totals.expense) + Math.abs(totals.transfer);

export const resolveTransactionSource = (
  transaction: ParsedTransaction
): TransactionSource => {
  if (transaction.source) {
    return transaction.source;
  }

  if (transaction.broker) {
    return {
      name: transaction.broker,
      type: "broker",
    };
  }

  if (transaction.description) {
    return {
      name: transaction.description,
      type: "unknown",
    };
  }

  return defaultSource;
};

const normalizeSource = (
  source: TransactionSource,
  fallback: ParsedTransaction
): TransactionSource => {
  if (source.type !== "unknown") {
    return source;
  }

  const normalizedType = SOURCE_TYPE_BY_KEYWORD.find(({ keyword }) =>
    source.name.toLowerCase().includes(keyword)
  )?.type;

  if (normalizedType) {
    return { ...source, type: normalizedType };
  }

  if (fallback.broker) {
    return {
      name: fallback.broker,
      type: "broker",
    };
  }

  return source.name ? source : defaultSource;
};

export const summarizeTransactionsByDate = (
  transactions: ParsedTransaction[]
): Map<string, DailySummary> => {
  interface SummaryAccumulator extends DailySummary {
    incomeGroup: DailyTransactionGroup;
    expenseGroup: DailyTransactionGroup;
  }

  const summaries = new Map<string, SummaryAccumulator>();

  transactions.forEach((transaction) => {
    const dateKey = getLocalDateKey(transaction.date);
    let summary = summaries.get(dateKey);

    if (!summary) {
      summary = {
        dateKey,
        date: cloneDateWithoutTime(transaction.date),
        totals: { income: 0, expense: 0, transfer: 0, net: 0 },
        recurringCount: 0,
        transactions: [],
        groups: [],
        currencySymbol: transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL,
        incomeGroup: {
          source: { name: "Income", type: "unknown" },
          totals: { income: 0, expense: 0, transfer: 0, net: 0 },
          transactions: [],
          currencySymbol: transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL,
        },
        expenseGroup: {
          source: { name: "Expenses", type: "unknown" },
          totals: { income: 0, expense: 0, transfer: 0, net: 0 },
          transactions: [],
          currencySymbol: transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL,
        },
      };
      summaries.set(dateKey, summary);
    }

    summary.transactions.push(transaction);
    if (transaction.currencySymbol) {
      summary.currencySymbol = transaction.currencySymbol;
    }
    if (transaction.isRecurring) {
      summary.recurringCount += 1;
    }

    applyAmountToTotals(summary.totals, transaction);

    // Group by income (positive amounts) vs expenses (negative amounts)
    // Transfers are included based on their sign
    if (transaction.amount > 0) {
      summary.incomeGroup.transactions.push(transaction);
      summary.incomeGroup.totals.net += transaction.amount;
      if (transaction.category === "Income") {
        summary.incomeGroup.totals.income += transaction.amount;
      } else if (transaction.category === "Transfer") {
        summary.incomeGroup.totals.transfer += transaction.amount;
      }
      if (transaction.currencySymbol) {
        summary.incomeGroup.currencySymbol = transaction.currencySymbol;
      }
    } else if (transaction.amount < 0) {
      summary.expenseGroup.transactions.push(transaction);
      summary.expenseGroup.totals.net += transaction.amount;
      if (transaction.category === "Expense") {
        summary.expenseGroup.totals.expense += transaction.amount;
      } else if (transaction.category === "Transfer") {
        summary.expenseGroup.totals.transfer += transaction.amount;
      }
      if (transaction.currencySymbol) {
        summary.expenseGroup.currencySymbol = transaction.currencySymbol;
      }
    }
  });

  summaries.forEach((summary) => {
    summary.transactions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    
    // Sort transactions within each group by amount
    summary.incomeGroup.transactions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    summary.expenseGroup.transactions.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    
    // Build groups array with only non-empty groups
    const groups: DailyTransactionGroup[] = [];
    if (summary.incomeGroup.transactions.length > 0) {
      groups.push(summary.incomeGroup);
    }
    if (summary.expenseGroup.transactions.length > 0) {
      groups.push(summary.expenseGroup);
    }
    summary.groups = groups;
  });

  return new Map<string, DailySummary>(
    Array.from(summaries.entries(), ([key, value]) => [
      key,
      {
        dateKey: value.dateKey,
        date: value.date,
        totals: value.totals,
        recurringCount: value.recurringCount,
        transactions: value.transactions,
        groups: value.groups,
        currencySymbol: value.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL,
      },
    ])
  );
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  const startDay = firstDay.getDay();
  for (let i = 0; i < startDay; i++) {
    const prevDate = new Date(year, month, -startDay + i + 1);
    days.push(prevDate);
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
};
