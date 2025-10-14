import type { ParsedTransaction, TransactionCategory } from "@shared/schema";

export const BUDGET_STORAGE_KEY = "transaction-calendar-monthly-budgets";
export const BUDGET_CATEGORIES: TransactionCategory[] = ["Income", "Expense"];

export type MonthBudgets = Record<TransactionCategory, number | null>;
export type CategoryActuals = Record<TransactionCategory, number>;
export type BudgetStorage = Record<string, MonthBudgets>;

export const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const sanitizeBudgetValue = (value: number | null | undefined): number | null => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  if (value <= 0) {
    return null;
  }

  return Math.round(value * 100) / 100;
};

export const getDefaultMonthBudgets = (): MonthBudgets => ({
  Income: null,
  Expense: null,
});

export const normalizeBudgets = (
  budgets?: Partial<MonthBudgets> | null
): MonthBudgets => {
  const base = getDefaultMonthBudgets();
  if (!budgets) {
    return base;
  }

  return BUDGET_CATEGORIES.reduce<MonthBudgets>((acc, category) => {
    acc[category] = sanitizeBudgetValue(budgets[category] ?? null);
    return acc;
  }, base);
};

export const readBudgetStorage = (): BudgetStorage => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as BudgetStorage;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to read budget storage", error);
    return {};
  }
};

export const writeBudgetStorage = (storage: BudgetStorage) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.warn("Failed to persist budget storage", error);
  }
};

export const calculateCategoryActuals = (
  transactions: ParsedTransaction[]
): CategoryActuals => {
  return transactions.reduce<CategoryActuals>(
    (acc, transaction) => {
      if (transaction.category === "Income") {
        acc.Income += Math.max(0, transaction.amount);
      } else if (transaction.category === "Expense") {
        acc.Expense += Math.abs(transaction.amount);
      }
      return acc;
    },
    {
      Income: 0,
      Expense: 0,
    }
  );
};

export interface BudgetProgress {
  actual: number;
  limit: number | null;
  progress: number;
  isOverBudget: boolean;
  remaining: number | null;
  overage: number;
}

export const calculateBudgetProgress = (
  actualRaw: number,
  limitRaw: number | null
): BudgetProgress => {
  const actual = Math.max(0, Math.round(actualRaw * 100) / 100);

  if (limitRaw === null || limitRaw === undefined) {
    return {
      actual,
      limit: null,
      progress: 0,
      isOverBudget: false,
      remaining: null,
      overage: 0,
    };
  }

  const limit = sanitizeBudgetValue(limitRaw);
  if (!limit) {
    return {
      actual,
      limit: null,
      progress: 0,
      isOverBudget: false,
      remaining: null,
      overage: 0,
    };
  }

  const ratio = actual / limit;
  const isOverBudget = ratio > 1;
  const progress = Math.min(ratio, 1);

  return {
    actual,
    limit,
    progress,
    isOverBudget,
    remaining: isOverBudget ? 0 : Math.max(limit - actual, 0),
    overage: isOverBudget ? actual - limit : 0,
  };
};
