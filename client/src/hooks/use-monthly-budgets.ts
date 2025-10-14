import { useCallback, useEffect, useMemo, useState } from "react";
import type { TransactionCategory } from "@shared/schema";
import {
  getMonthKey,
  normalizeBudgets,
  readBudgetStorage,
  writeBudgetStorage,
  getDefaultMonthBudgets,
  type MonthBudgets,
} from "@/lib/budgetUtils";

const loadBudgetsForMonth = (monthKey: string): MonthBudgets => {
  if (typeof window === "undefined") {
    return getDefaultMonthBudgets();
  }

  const storage = readBudgetStorage();
  const storedBudgets = storage[monthKey];
  return normalizeBudgets(storedBudgets);
};

const persistBudgets = (monthKey: string, budgets: MonthBudgets) => {
  if (typeof window === "undefined") {
    return;
  }

  const storage = readBudgetStorage();
  const hasAnyBudget = Object.values(budgets).some(
    (value) => typeof value === "number" && value > 0
  );

  if (hasAnyBudget) {
    storage[monthKey] = budgets;
  } else {
    delete storage[monthKey];
  }

  writeBudgetStorage(storage);
};

export const useMonthlyBudgets = (currentDate: Date) => {
  const monthKey = useMemo(() => getMonthKey(currentDate), [currentDate]);
  const [budgets, setBudgets] = useState<MonthBudgets>(() =>
    loadBudgetsForMonth(monthKey)
  );

  useEffect(() => {
    setBudgets(loadBudgetsForMonth(monthKey));
  }, [monthKey]);

  const applyAndPersist = useCallback(
    (updater: (previous: MonthBudgets) => MonthBudgets) => {
      setBudgets((previous) => {
        const normalizedPrevious = normalizeBudgets(previous);
        const updated = normalizeBudgets(updater(normalizedPrevious));
        persistBudgets(monthKey, updated);
        return updated;
      });
    },
    [monthKey]
  );

  const saveBudgets = useCallback(
    (next: MonthBudgets) => {
      applyAndPersist(() => next);
    },
    [applyAndPersist]
  );

  const setBudgetForCategory = useCallback(
    (category: TransactionCategory, amount: number | null) => {
      applyAndPersist((previous) => ({
        ...previous,
        [category]: amount,
      }));
    },
    [applyAndPersist]
  );

  const resetBudgets = useCallback(() => {
    applyAndPersist(() => getDefaultMonthBudgets());
  }, [applyAndPersist]);

  const hasBudgets = useMemo(
    () => Object.values(budgets).some((value) => value !== null),
    [budgets]
  );

  return {
    monthKey,
    budgets,
    hasBudgets,
    saveBudgets,
    setBudgetForCategory,
    resetBudgets,
  };
};
