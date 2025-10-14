import type { ParsedTransaction, TransactionCategory } from "@shared/schema";

export interface CategoryAnomaly {
  transaction: ParsedTransaction;
  category: TransactionCategory;
  deviation: number;
  score: number;
  median: number;
  mad: number;
}

export const median = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].filter((value) => Number.isFinite(value));
  if (sorted.length === 0) {
    return null;
  }

  sorted.sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
  }

  return sorted[middleIndex];
};

export const medianAbsoluteDeviation = (
  values: number[],
  centerValue?: number | null
): number | null => {
  if (values.length === 0) {
    return null;
  }

  const medianValue =
    centerValue !== undefined ? centerValue : median(values);
  if (medianValue === null) {
    return null;
  }

  const deviations = values.map((value) => Math.abs(value - medianValue));
  return median(deviations);
};

const isAnomalyCandidate = (values: number[]): boolean => {
  if (values.length < 3) {
    return false;
  }

  const uniqueValues = new Set(values.map((value) => value.toFixed(2)));
  return uniqueValues.size > 1;
};

export const detectCategoryAnomalies = (
  transactions: ParsedTransaction[],
  threshold = 3
): CategoryAnomaly[] => {
  const grouped = new Map<TransactionCategory, ParsedTransaction[]>();

  transactions.forEach((transaction) => {
    const group = grouped.get(transaction.category) ?? [];
    group.push(transaction);
    grouped.set(transaction.category, group);
  });

  const anomalies: CategoryAnomaly[] = [];

  grouped.forEach((items, category) => {
    const amounts = items.map((item) => item.amount);

    if (!isAnomalyCandidate(amounts)) {
      return;
    }

    const categoryMedian = median(amounts);
    if (categoryMedian === null) {
      return;
    }

    const categoryMad = medianAbsoluteDeviation(amounts, categoryMedian);
    if (categoryMad === null || categoryMad <= Number.EPSILON) {
      return;
    }

    items.forEach((transaction) => {
      const deviation = Math.abs(transaction.amount - categoryMedian);
      const score = deviation / categoryMad;

      if (score > threshold) {
        anomalies.push({
          transaction,
          category,
          deviation,
          score,
          median: categoryMedian,
          mad: categoryMad,
        });
      }
    });
  });

  return anomalies.sort((a, b) => b.score - a.score);
};
