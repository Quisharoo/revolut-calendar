import type { ParsedTransaction } from "@shared/schema";
import { normalizeTextForKey } from "./stringUtils";
import { getFlowType } from "./transactionFormatUtils";

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

const toCents = (amount: number) => Math.round(amount * 100);

const getGroupingKey = (transaction: ParsedTransaction) => {
  const label = transaction.source?.name ?? transaction.description;
  const normalisedLabel = normalizeTextForKey(label);
  const direction = getFlowType(transaction.amount);
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
