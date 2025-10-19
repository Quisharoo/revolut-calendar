import { describe, expect, it } from "vitest";
import type { ParsedTransaction } from "@shared/schema";
import {
  buildRangeCsv,
  buildRangeSummary,
  filterTransactionsInRange,
} from "../rangeSummary";
import type { DateRange } from "@/types/range";

const mockTransactions: ParsedTransaction[] = [
  {
    id: "salary",
    date: new Date("2024-05-01T09:00:00"),
    description: "Monthly Salary",
    amount: 2000,
    category: "Income",
    source: { name: "Acme Corp", type: "broker" },
    isRecurring: true,
    currencySymbol: "$",
  },
  {
    id: "coffee",
    date: new Date("2024-05-02T08:30:00"),
    description: "Morning Coffee",
    amount: -5.5,
    category: "Expense",
    source: { name: "Daily Beans", type: "merchant" },
    isRecurring: false,
    currencySymbol: "$",
  },
  {
    id: "groceries",
    date: new Date("2024-05-02T15:45:00"),
    description: "Weekly Groceries",
    amount: -123.45,
    category: "Expense",
    source: { name: "Fresh Mart", type: "merchant" },
    isRecurring: false,
    currencySymbol: "$",
  },
  {
    id: "freelance",
    date: new Date("2024-05-03T10:00:00"),
    description: "Freelance Project",
    amount: 500,
    category: "Income",
    source: { name: "Acme Corp", type: "broker" },
    isRecurring: false,
    currencySymbol: "$",
  },
  {
    id: "ignored",
    date: new Date("2024-05-05T12:00:00"),
    description: "Outside Range",
    amount: -10,
    category: "Expense",
    source: { name: "Elsewhere", type: "merchant" },
    isRecurring: false,
    currencySymbol: "$",
  },
];

describe("rangeSummary helpers", () => {
  const range: DateRange = {
    start: new Date("2024-05-01T00:00:00"),
    end: new Date("2024-05-03T23:59:59"),
  };

  it("filters transactions inclusively by the provided range", () => {
    const filtered = filterTransactionsInRange(mockTransactions, range);
    expect(filtered.map((t) => t.id)).toEqual([
      "salary",
      "coffee",
      "groceries",
      "freelance",
    ]);
  });

  it("summarises totals, ranks merchants and categories, and finds the largest transaction", () => {
    const filtered = filterTransactionsInRange(mockTransactions, range);
    const summary = buildRangeSummary(filtered, range);

    expect(summary.dayCount).toBe(3);
    expect(summary.transactionCount).toBe(4);
    expect(summary.totalIncome).toBeCloseTo(2500);
    expect(summary.totalExpense).toBeCloseTo(-128.95);
    expect(summary.netTotal).toBeCloseTo(2371.05);
    expect(summary.currencySymbol).toBe("$");
    expect(summary.rangeLabel).toContain("May");

    expect(summary.topMerchants[0]).toMatchObject({
      name: "Acme Corp",
      count: 2,
    });
    expect(summary.topCategories[0]).toMatchObject({
      category: "Income",
      count: 2,
    });
    expect(summary.largestTransaction?.id).toBe("salary");
  });

  it("builds a CSV string with the selected transactions", () => {
    const filtered = filterTransactionsInRange(mockTransactions, range);
    const csv = buildRangeCsv(filtered);

    const rows = csv.trim().split("\n");
    expect(rows[0]).toBe("Date,Description,Amount,Category,Source");
    expect(rows).toContain(
      '"2024-05-02","Morning Coffee","-5.50","Expense","Daily Beans"'
    );
    expect(rows.length).toBe(filtered.length + 1);
  });
});
