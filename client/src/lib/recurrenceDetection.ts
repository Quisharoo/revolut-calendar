import type { ParsedTransaction } from "@shared/schema";

interface RecurrenceDetectionOptions {
  minDaysBetweenOccurrences: number;
  maxDaysBetweenOccurrences: number;
  minOccurrences: number;
  amountToleranceCents: number;
}

const DEFAULT_OPTIONS: RecurrenceDetectionOptions = {
  minDaysBetweenOccurrences: 27,
  maxDaysBetweenOccurrences: 33,
  minOccurrences: 3,
  amountToleranceCents: 100,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const toCents = (amount: number) => Math.round(amount * 100);

const getGroupingKey = (transaction: ParsedTransaction) => {
  const label = transaction.source?.name ?? transaction.description;
  const normalisedLabel = normalizeLabel(label);
  const direction = transaction.amount >= 0 ? "in" : "out";
  return `${normalisedLabel}|${direction}`;
};

const isWithinMonthlyWindow = (
  first: Date,
  second: Date,
  options: RecurrenceDetectionOptions
) => {
  const diffDays = Math.round(Math.abs(second.getTime() - first.getTime()) / MS_PER_DAY);
  return (
    diffDays >= options.minDaysBetweenOccurrences &&
    diffDays <= options.maxDaysBetweenOccurrences
  );
};

const amountsWithinTolerance = (
  first: ParsedTransaction,
  second: ParsedTransaction,
  options: RecurrenceDetectionOptions
) => Math.abs(toCents(first.amount) - toCents(second.amount)) <= options.amountToleranceCents;

export const detectRecurringTransactions = (
  transactions: ParsedTransaction[],
  options: Partial<RecurrenceDetectionOptions> = {}
): Set<string> => {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const grouped = new Map<string, ParsedTransaction[]>();

  transactions.forEach((transaction) => {
    const key = getGroupingKey(transaction);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(transaction);
  });

  const recurringIds = new Set<string>();

  grouped.forEach((groupTransactions) => {
    const sorted = [...groupTransactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    if (sorted.length < resolvedOptions.minOccurrences) {
      return;
    }

    let runStartIndex = 0;
    let runLength = 1;
    const runCandidateIndices = new Set<number>();

    for (let index = 1; index < sorted.length; index += 1) {
      const current = sorted[index];
      const previous = sorted[index - 1];

      if (
        isWithinMonthlyWindow(previous.date, current.date, resolvedOptions) &&
        amountsWithinTolerance(previous, current, resolvedOptions)
      ) {
        runLength += 1;
        if (runLength === 2) {
          runCandidateIndices.add(runStartIndex);
        }
        runCandidateIndices.add(index);
      } else {
        runStartIndex = index;
        runLength = 1;
      }
    }

    if (runCandidateIndices.size >= resolvedOptions.minOccurrences) {
      runCandidateIndices.forEach((candidateIndex) => {
        const transaction = sorted[candidateIndex];
        recurringIds.add(transaction.id);
      });
    }
  });

  return recurringIds;
};

export const applyRecurringDetection = (
  transactions: ParsedTransaction[],
  options: Partial<RecurrenceDetectionOptions> = {}
): ParsedTransaction[] => {
  const recurringIds = detectRecurringTransactions(transactions, options);
  return transactions.map((transaction) => ({
    ...transaction,
    isRecurring: recurringIds.has(transaction.id),
  }));
};

export interface RecurringSeriesSummary {
  /** Stable identifier derived from the recurrence grouping logic */
  groupId: string;
  /** Transaction instance occurring within the requested month */
  representative: ParsedTransaction;
  /** All transaction ids belonging to this recurring series */
  occurrenceIds: string[];
  /** Total number of detected occurrences for the series */
  occurrenceCount: number;
  /** Earliest detected occurrence date */
  firstOccurrence: Date;
  /** Most recent detected occurrence date */
  lastOccurrence: Date;
}

const toMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

export const summarizeRecurringTransactionsForMonth = (
  transactions: ParsedTransaction[],
  monthDate: Date,
  options: Partial<RecurrenceDetectionOptions> = {}
): RecurringSeriesSummary[] => {
  if (!transactions.length) {
    return [];
  }

  const annotated = applyRecurringDetection(transactions, options);
  const targetMonthKey = toMonthKey(monthDate);

  const groups = new Map<string, ParsedTransaction[]>();

  annotated.forEach((transaction) => {
    if (!transaction.isRecurring) {
      return;
    }
    const key = getGroupingKey(transaction);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(transaction);
  });

  const summaries: RecurringSeriesSummary[] = [];

  groups.forEach((transactionsInGroup, groupId) => {
    if (!transactionsInGroup.length) {
      return;
    }

    const sorted = [...transactionsInGroup].sort(
      (first, second) => first.date.getTime() - second.date.getTime()
    );

    const representative = sorted.find(
      (transaction) => toMonthKey(transaction.date) === targetMonthKey
    );

    if (!representative) {
      return;
    }

    summaries.push({
      groupId,
      representative,
      occurrenceIds: sorted.map((transaction) => transaction.id),
      occurrenceCount: sorted.length,
      firstOccurrence: sorted[0].date,
      lastOccurrence: sorted[sorted.length - 1].date,
    });
  });

  return summaries.sort((first, second) => {
    const dateDiff =
      first.representative.date.getTime() - second.representative.date.getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    const firstLabel = first.representative.description.toLowerCase();
    const secondLabel = second.representative.description.toLowerCase();
    if (firstLabel < secondLabel) {
      return -1;
    }
    if (firstLabel > secondLabel) {
      return 1;
    }
    return 0;
  });
};
