import { describe, expect, it } from "vitest";
import type { ParsedTransaction } from "@shared/schema";
import {
  calculateBudgetProgress,
  calculateCategoryActuals,
} from "../budgetUtils";

describe("budgetUtils", () => {
  it("computes progress and remaining amount when under budget", () => {
    const progress = calculateBudgetProgress(750, 1000);

    expect(progress.limit).toBe(1000);
    expect(progress.actual).toBe(750);
    expect(progress.progress).toBeCloseTo(0.75, 2);
    expect(progress.isOverBudget).toBe(false);
    expect(progress.remaining).toBe(250);
    expect(progress.overage).toBe(0);
  });

  it("flags over budget and reports overage when limit exceeded", () => {
    const progress = calculateBudgetProgress(1200.25, 1000);

    expect(progress.limit).toBe(1000);
    expect(progress.actual).toBeCloseTo(1200.25, 2);
    expect(progress.progress).toBe(1); // capped at 100%
    expect(progress.isOverBudget).toBe(true);
    expect(progress.remaining).toBe(0);
    expect(progress.overage).toBeCloseTo(200.25, 2);
  });

  it("aggregates category actuals using absolute values for expenses", () => {
    const transactions: ParsedTransaction[] = [
      {
        id: "income-1",
        date: new Date("2024-01-01T00:00:00Z"),
        description: "Salary",
        amount: 3200,
        category: "Income",
        broker: "Employer",
        source: { name: "Employer", type: "broker" },
        isRecurring: false,
      },
      {
        id: "expense-1",
        date: new Date("2024-01-02T00:00:00Z"),
        description: "Rent",
        amount: -1500,
        category: "Expense",
        broker: "Landlord",
        source: { name: "Landlord", type: "merchant" },
        isRecurring: true,
      },
      {
        id: "expense-2",
        date: new Date("2024-01-03T00:00:00Z"),
        description: "Groceries",
        amount: -250.5,
        category: "Expense",
        broker: "Store",
        source: { name: "Store", type: "merchant" },
        isRecurring: false,
      },
    ];

    const actuals = calculateCategoryActuals(transactions);

    expect(actuals.Income).toBe(3200);
    expect(actuals.Expense).toBeCloseTo(1750.5, 2);
  });
});
