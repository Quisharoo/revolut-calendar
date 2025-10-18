import {
  RecurringSeriesSchema,
  type RecurringSeries,
  type Transaction,
  TransactionSchema,
} from "@shared/schema";
import {
  HIGH_AMOUNT_TOLERANCE_RATIO,
  MIN_OCCURRENCES_FOR_SERIES,
  MIN_SERIES_SPAN_DAYS,
  TOLERANCE_BANDS,
} from "@shared/constants";
import { buildDeterministicUid } from "@shared/utils";

export interface RecurrenceDetectionResult {
  series: RecurringSeries[];
  orphanIds: string[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const resolveTolerance = (amount: number) => {
  const abs = Math.abs(amount);
  for (const band of TOLERANCE_BANDS) {
    if (abs <= band.maxAmount) {
      return band.type === "absolute" ? band.value : abs * band.value;
    }
  }
  return abs * HIGH_AMOUNT_TOLERANCE_RATIO;
};

const resolveToleranceBand = (amount: number) => {
  const abs = Math.abs(amount);
  if (abs <= TOLERANCE_BANDS[0].maxAmount) {
    return `<=${TOLERANCE_BANDS[0].maxAmount}`;
  }
  if (abs <= TOLERANCE_BANDS[1].maxAmount) {
    return `<=${TOLERANCE_BANDS[1].maxAmount}`;
  }
  return `>${TOLERANCE_BANDS[1].maxAmount}`;
};

const daysBetween = (first: Date, second: Date) =>
  Math.round(Math.abs(second.getTime() - first.getTime()) / MS_PER_DAY);

const isMonthEnd = (date: Date) => {
  const next = new Date(date);
  next.setDate(date.getDate() + 1);
  return next.getDate() === 1;
};

const isWithinMonthlyWindow = (previous: Date, current: Date) => {
  const diff = daysBetween(previous, current);
  const min = 27;
  const baseMax = 33;
  if (diff < min) {
    return false;
  }
  if (diff <= baseMax) {
    return true;
  }
  return isMonthEnd(previous) && diff <= 35;
};

const buildGroupKey = (transaction: Transaction) => {
  const label = transaction.source.name || transaction.description;
  const normalizedLabel = normalizeLabel(label);
  const direction = transaction.amount >= 0 ? "credit" : "debit";
  const toleranceBand = resolveToleranceBand(transaction.amount);
  return `${normalizedLabel}|${direction}|${toleranceBand}`;
};

const averageAmount = (transactions: Transaction[]) => {
  if (transactions.length === 0) return 0;
  return transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length;
};

const ensureSeries = (rawSeries: RecurringSeries[]): RecurringSeries[] =>
  rawSeries.map((series) => RecurringSeriesSchema.parse(series));

export const detectRecurringSeries = (
  inputTransactions: Transaction[]
): RecurrenceDetectionResult => {
  const transactions = inputTransactions.map((transaction) =>
    TransactionSchema.parse(transaction)
  );
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const key = buildGroupKey(transaction);
    const existing = grouped.get(key) ?? [];
    existing.push(transaction);
    grouped.set(key, existing);
  });

  const qualifyingSeries: RecurringSeries[] = [];
  const recurringTransactionIds = new Set<string>();

  grouped.forEach((groupTransactions) => {
    const sorted = [...groupTransactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    if (sorted.length < MIN_OCCURRENCES_FOR_SERIES) {
      return;
    }

    let currentSequence: Transaction[] = [sorted[0]];

    const finalizeSequence = () => {
      if (currentSequence.length < MIN_OCCURRENCES_FOR_SERIES) {
        currentSequence = [];
        return;
      }

      const first = currentSequence[0];
      const last = currentSequence[currentSequence.length - 1];
      const spanDays = daysBetween(first.date, last.date);
      if (spanDays < MIN_SERIES_SPAN_DAYS) {
        currentSequence = [];
        return;
      }

      const meanAmount = averageAmount(currentSequence);

      const occurrences = currentSequence.map((transaction) => ({
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        delta: transaction.amount - meanAmount,
      }));

      const gaps: RecurringSeries["explanation"]["gaps"] = [];
      for (let index = 1; index < currentSequence.length; index += 1) {
        const previous = currentSequence[index - 1];
        const current = currentSequence[index];
        const diff = daysBetween(previous.date, current.date);
        if (diff > 35) {
          gaps.push({
            from: previous.date,
            to: current.date,
            days: diff,
          });
        }
      }

      const label = first.source.name || first.description;
      const direction = meanAmount >= 0 ? "credit" : "debit";
      const seed = [
        normalizeLabel(label),
        direction,
        first.date.toISOString(),
        last.date.toISOString(),
        Math.abs(meanAmount).toFixed(2),
      ].join("|");

      const rrule = `FREQ=MONTHLY;BYMONTHDAY=${first.date.getDate()}`;

      const series: RecurringSeries = {
        id: buildDeterministicUid(seed),
        label,
        transactionIds: currentSequence.map((tx) => tx.id),
        direction,
        amount: meanAmount,
        currencySymbol: currentSequence[0].currencySymbol,
        startDate: first.date,
        endDate: last.date,
        rrule,
        explanation: {
          occurrences,
          totalSpanDays: spanDays,
          gaps,
        },
      };

      qualifyingSeries.push(series);
      currentSequence.forEach((tx) => recurringTransactionIds.add(tx.id));
      currentSequence = [];
    };

    for (let index = 1; index < sorted.length; index += 1) {
      const candidate = sorted[index];
      const previous = currentSequence[currentSequence.length - 1];
      const meanAmount = averageAmount(currentSequence);
      const tolerance = resolveTolerance(meanAmount);
      const amountDiff = Math.abs(candidate.amount - meanAmount);

      if (isWithinMonthlyWindow(previous.date, candidate.date) && amountDiff <= tolerance) {
        currentSequence.push(candidate);
      } else {
        finalizeSequence();
        currentSequence = [candidate];
      }
    }

    finalizeSequence();
  });

  const series = ensureSeries(qualifyingSeries);
  const orphanIds = transactions
    .filter((transaction) => !recurringTransactionIds.has(transaction.id))
    .map((transaction) => transaction.id);

  return { series, orphanIds };
};

export const applyRecurringDetection = (transactions: Transaction[]) => {
  const { series, orphanIds } = detectRecurringSeries(transactions);
  const recurringIds = new Set(series.flatMap((item) => item.transactionIds));

  return {
    transactions: transactions.map((transaction) => ({
      ...transaction,
      isRecurring: recurringIds.has(transaction.id),
    })),
    series,
    orphanIds,
  };
};
