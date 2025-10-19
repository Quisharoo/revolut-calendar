import { DEFAULT_CURRENCY_SYMBOL } from "@shared/constants";
import type {
  ParsedTransaction,
  RecurringSeries,
} from "@shared/schema";
import { sortByDateAscending } from "@shared/utils";

export interface RecurrenceDetectionOptions {
  minOccurrences: number;
  minSpanDays: number;
  maxSpanDays: number;
  maxSkippedMonths: number;
  dayFlexToleranceDays: number;
  groupingSubstrings?: string[];
}

const DEFAULT_OPTIONS: RecurrenceDetectionOptions = {
  minOccurrences: 3,
  minSpanDays: 90,
  maxSpanDays: 370,
  maxSkippedMonths: 6,
  dayFlexToleranceDays: 4,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const resolveToleranceBand = (amount: number) => {
  const magnitude = Math.abs(amount);
  if (magnitude <= 50) {
    return "band-50";
  }
  if (magnitude < 500) {
    return "band-1pct";
  }
  return "band-0.5pct";
};

const normalizeLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/^\s*(to|from|transfer|payment)\s+/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

export const getGroupingKey = (
  transaction: ParsedTransaction,
  groupingSubstrings?: string[]
) => {
  const sourceLabel = transaction.source?.name ?? transaction.description;
  const normalisedLabel = normalizeLabel(sourceLabel);
  const direction = transaction.amount >= 0 ? "in" : "out";
  const toleranceBand = resolveToleranceBand(transaction.amount);

  if (groupingSubstrings?.length) {
    const match = groupingSubstrings.find((candidate) =>
      normalisedLabel.includes(candidate.toLowerCase())
    );
    if (match) {
      return `${match.toLowerCase()}|${direction}|${toleranceBand}`;
    }
  }

  return `${normalisedLabel}|${direction}|${toleranceBand}`;
};

const median = (values: number[]): number => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
};

const diffInDays = (a: Date, b: Date) =>
  Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);

const buildSeriesId = (key: string, transactions: ParsedTransaction[]) => {
  const head = transactions[0];
  const tail = transactions[transactions.length - 1];
  const seed = `${key}|${head?.id ?? ""}|${tail?.id ?? ""}|${transactions.length}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${key.replace(/[^a-z0-9]+/g, "-")}-${(hash >>> 0).toString(36)}`;
};

const buildExplanation = (
  transactions: ParsedTransaction[],
  currencySymbol: string
): RecurringSeries["explanation"] => {
  const occurrenceIds = transactions.map((transaction) => transaction.id);
  const occurrenceDates = transactions.map((transaction) => transaction.date);

  const gaps = [] as RecurringSeries["explanation"]["gaps"];
  let minSpanDays = Number.POSITIVE_INFINITY;
  let maxSpanDays = 0;
  let weekdayDriftDays = 0;

  for (let index = 1; index < transactions.length; index += 1) {
    const previous = transactions[index - 1];
    const current = transactions[index];
    const span = Math.abs(diffInDays(previous.date, current.date));
    minSpanDays = Math.min(minSpanDays, span);
    maxSpanDays = Math.max(maxSpanDays, span);

    const weekdayDelta = Math.abs(previous.date.getDay() - current.date.getDay());
    weekdayDriftDays = Math.max(weekdayDriftDays, weekdayDelta);

    gaps.push({ from: previous.date, to: current.date, days: span });
  }

  if (!Number.isFinite(minSpanDays)) {
    minSpanDays = 0;
  }

  const amounts = transactions.map((transaction) => Math.abs(transaction.amount));
  const referenceAmount = median(amounts);
  const deltas = transactions.map((transaction) =>
    Math.abs(Math.abs(transaction.amount) - referenceAmount)
  );
  const minDelta = Math.min(...deltas);
  const maxDelta = Math.max(...deltas);
  const averageDelta = deltas.reduce((total, value) => total + value, 0) / deltas.length;

  return {
    occurrenceIds,
    occurrenceDates,
    minSpanDays,
    maxSpanDays,
    weekdayDriftDays,
    gaps,
    amountDelta: {
      min: Number.isFinite(minDelta) ? minDelta : 0,
      max: Number.isFinite(maxDelta) ? maxDelta : 0,
      average: Number.isFinite(averageDelta) ? averageDelta : 0,
      currencySymbol,
    },
    notes: [`Median amount ${currencySymbol}${referenceAmount.toFixed(2)}`],
  };
};

const resolveAmountTolerance = (referenceAmount: number) => {
  const magnitude = Math.abs(referenceAmount);
  if (magnitude <= 50) {
    return 0.5;
  }
  if (magnitude < 500) {
    return magnitude * 0.01;
  }
  return magnitude * 0.005;
};

const filterByAmountTolerance = (transactions: ParsedTransaction[]) => {
  if (!transactions.length) {
    return [] as ParsedTransaction[];
  }
  const absAmounts = transactions.map((transaction) => Math.abs(transaction.amount));
  const centralAmount = median(absAmounts);
  const tolerance = resolveAmountTolerance(centralAmount || transactions[0]?.amount || 0);
  return transactions.filter(
    (transaction) => Math.abs(Math.abs(transaction.amount) - centralAmount) <= tolerance
  );
};

export interface DetectRecurringResult {
  series: RecurringSeries[];
  orphanIds: string[];
}

export const detectRecurringSeries = (
  transactions: ParsedTransaction[],
  options: Partial<RecurrenceDetectionOptions> = {}
): DetectRecurringResult => {
  if (!transactions.length) {
    return { series: [], orphanIds: [] };
  }

  const resolved = { ...DEFAULT_OPTIONS, ...options };
  const grouped = new Map<string, ParsedTransaction[]>();

  transactions.forEach((transaction) => {
    const key = getGroupingKey(transaction, resolved.groupingSubstrings);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(transaction);
  });

  const series: RecurringSeries[] = [];

  grouped.forEach((groupTransactions, key) => {
    const sorted = sortByDateAscending(groupTransactions);
    if (sorted.length < resolved.minOccurrences) {
      return;
    }

    const filtered = filterByAmountTolerance(sorted);
    if (filtered.length < resolved.minOccurrences) {
      return;
    }

    const spanDays = diffInDays(filtered[0].date, filtered[filtered.length - 1].date);
    if (spanDays < resolved.minSpanDays || spanDays > resolved.maxSpanDays) {
      return;
    }

    const transactionByMonthId = new Map<number, ParsedTransaction>();
    filtered.forEach((transaction) => {
      const monthId = transaction.date.getFullYear() * 12 + transaction.date.getMonth();
      const previous = transactionByMonthId.get(monthId);
      if (!previous || transaction.date.getTime() > previous.date.getTime()) {
        transactionByMonthId.set(monthId, transaction);
      }
    });

    const occurrences = Array.from(transactionByMonthId.values()).sort(
      (first, second) => first.date.getTime() - second.date.getTime()
    );

    if (occurrences.length < resolved.minOccurrences) {
      return;
    }

    const baseCurrency =
      occurrences[0]?.currencySymbol ?? filtered[0]?.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;

    series.push({
      id: buildSeriesId(key, occurrences),
      key,
      cadence: "monthly",
      transactions: occurrences,
      representative: occurrences[occurrences.length - 1],
      explanation: buildExplanation(occurrences, baseCurrency),
    });
  });

  const recurringIds = new Set<string>();
  series.forEach((entry) => {
    entry.transactions.forEach((transaction) => {
      recurringIds.add(transaction.id);
    });
  });

  const orphanIds = transactions
    .filter((transaction) => !recurringIds.has(transaction.id))
    .map((transaction) => transaction.id);

  return {
    series,
    orphanIds,
  };
};

export const annotateTransactionsWithRecurrence = (
  transactions: ParsedTransaction[],
  series: RecurringSeries[]
): ParsedTransaction[] => {
  if (!series.length) {
    return transactions.map((transaction) => ({ ...transaction, isRecurring: false }));
  }

  const recurringIds = new Set<string>();
  series.forEach((entry) => {
    entry.transactions.forEach((transaction) => recurringIds.add(transaction.id));
  });

  return transactions.map((transaction) => ({
    ...transaction,
    isRecurring: recurringIds.has(transaction.id),
  }));
};

export const selectSeriesForMonth = (
  series: RecurringSeries[],
  monthDate: Date
): RecurringSeries[] => {
  const targetYear = monthDate.getFullYear();
  const targetMonth = monthDate.getMonth();

  return series
    .map((entry) => {
      const occurrence = entry.transactions.find(
        (transaction) =>
          transaction.date.getFullYear() === targetYear &&
          transaction.date.getMonth() === targetMonth
      );
      if (!occurrence) {
        return null;
      }
      return {
        ...entry,
        representative: occurrence,
      };
    })
    .filter((value): value is RecurringSeries => Boolean(value));
};
