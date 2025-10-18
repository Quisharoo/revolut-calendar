import type { ParsedTransaction } from "@shared/schema";

interface RecurrenceDetectionOptions {
  minDaysBetweenOccurrences: number;
  maxDaysBetweenOccurrences: number;
  minOccurrences: number;
  amountToleranceCents: number;
  dayFlexToleranceDays: number;
  maxSkippedMonths: number;
}

const DEFAULT_OPTIONS: RecurrenceDetectionOptions = {
  minDaysBetweenOccurrences: 27,
  maxDaysBetweenOccurrences: 33,
  minOccurrences: 3,
  amountToleranceCents: 100,
  dayFlexToleranceDays: 4,
  maxSkippedMonths: 1,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normalizeLabel = (label: string) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const getGroupingKey = (transaction: ParsedTransaction) => {
  const label = transaction.source?.name ?? transaction.description;
  const normalisedLabel = normalizeLabel(label);
  const direction = transaction.amount >= 0 ? "in" : "out";
  return `${normalisedLabel}|${direction}`;
};

const getMonthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

const shouldPromotePrimary = (
  current: ParsedTransaction,
  candidate: ParsedTransaction
) => {
  const currentMagnitude = Math.abs(current.amount);
  const candidateMagnitude = Math.abs(candidate.amount);

  if (candidateMagnitude > currentMagnitude) {
    return true;
  }
  if (candidateMagnitude < currentMagnitude) {
    return false;
  }

  return candidate.date.getTime() > current.date.getTime();
};

type MonthlyBucket = {
  monthId: number;
  primary: ParsedTransaction;
  transactions: ParsedTransaction[];
};

const buildMonthlyBuckets = (
  transactions: ParsedTransaction[]
): MonthlyBucket[] => {
  const buckets = new Map<number, MonthlyBucket>();

  transactions.forEach((transaction) => {
    const monthId = getMonthIndex(transaction.date);
    const bucket = buckets.get(monthId);

    if (!bucket) {
      buckets.set(monthId, {
        monthId,
        primary: transaction,
        transactions: [transaction],
      });
      return;
    }

    bucket.transactions.push(transaction);
    if (shouldPromotePrimary(bucket.primary, transaction)) {
      bucket.primary = transaction;
    }
  });

  return Array.from(buckets.values()).sort((first, second) => first.monthId - second.monthId);
};

const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middleIndex];
  }

  const lower = sorted[middleIndex - 1];
  const upper = sorted[middleIndex];
  return Math.round((lower + upper) / 2);
};

const selectRepresentativeForMonth = (
  bucket: MonthlyBucket,
  targetDay: number
): ParsedTransaction => {
  const fallbackDay = bucket.primary.date.getDate();
  const referenceDay = Number.isFinite(targetDay) && targetDay > 0 ? targetDay : fallbackDay;

  return bucket.transactions.reduce<ParsedTransaction>((best, candidate) => {
    const bestDayDiff = Math.abs(best.date.getDate() - referenceDay);
    const candidateDayDiff = Math.abs(candidate.date.getDate() - referenceDay);

    if (candidateDayDiff !== bestDayDiff) {
      return candidateDayDiff < bestDayDiff ? candidate : best;
    }

    const bestMagnitude = Math.abs(best.amount);
    const candidateMagnitude = Math.abs(candidate.amount);
    if (candidateMagnitude !== bestMagnitude) {
      return candidateMagnitude > bestMagnitude ? candidate : best;
    }

    return candidate.date.getTime() > best.date.getTime() ? candidate : best;
  }, bucket.transactions[0]);
};

const findQualifyingMonthIds = (
  buckets: MonthlyBucket[],
  options: RecurrenceDetectionOptions
): Set<number> => {
  const qualifying = new Set<number>();

  if (buckets.length < options.minOccurrences) {
    return qualifying;
  }

  const maxMonthGap = options.maxSkippedMonths + 1;
  const minAllowed = Math.max(options.minDaysBetweenOccurrences - options.dayFlexToleranceDays, 1);

  let run: MonthlyBucket[] = [buckets[0]];

  const finalizeRun = () => {
    if (run.length >= options.minOccurrences) {
      run.forEach((bucket) => {
        qualifying.add(bucket.monthId);
      });
    }
  };

  for (let index = 1; index < buckets.length; index += 1) {
    const previous = buckets[index - 1];
    const current = buckets[index];

    const monthGap = current.monthId - previous.monthId;
    const diffDays = Math.round(
      (current.primary.date.getTime() - previous.primary.date.getTime()) / MS_PER_DAY
    );

    const maxAllowed =
      options.maxDaysBetweenOccurrences * monthGap + options.dayFlexToleranceDays;

    const withinMonthGap = monthGap >= 1 && monthGap <= maxMonthGap;
    const withinWindow = diffDays >= minAllowed && diffDays <= maxAllowed;

    if (withinMonthGap && withinWindow) {
      run.push(current);
    } else {
      finalizeRun();
      run = [current];
    }
  }

  finalizeRun();

  return qualifying;
};

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

    const monthlyBuckets = buildMonthlyBuckets(sorted);
    if (monthlyBuckets.length < resolvedOptions.minOccurrences) {
      return;
    }

    const qualifyingMonthIds = findQualifyingMonthIds(monthlyBuckets, resolvedOptions);
    if (!qualifyingMonthIds.size) {
      return;
    }

    const bucketById = new Map<number, MonthlyBucket>();
    monthlyBuckets.forEach((bucket) => bucketById.set(bucket.monthId, bucket));

    const candidateDays = Array.from(qualifyingMonthIds).map((monthId) =>
      bucketById.get(monthId)!.primary.date.getDate()
    );
    const representativeDay = median(candidateDays);

    qualifyingMonthIds.forEach((monthId) => {
      const bucket = bucketById.get(monthId);
      if (!bucket) {
        return;
      }

      const representative = selectRepresentativeForMonth(bucket, representativeDay);
      recurringIds.add(representative.id);
    });
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
