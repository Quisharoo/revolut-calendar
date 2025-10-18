import { describe, expect, it } from "vitest";
import type { ParsedTransaction } from "@shared/schema";
import {
  applyRecurringDetection,
  detectRecurringTransactions,
  summarizeRecurringTransactionsForMonth,
} from "../recurrenceDetection";

type TransactionOverrides = {
  id: string;
  date: string;
  amount: number;
  description?: string;
  category?: ParsedTransaction["category"];
  source?: ParsedTransaction["source"];
  broker?: string;
  currencySymbol?: string;
  isRecurring?: boolean;
};

const createTransaction = (overrides: TransactionOverrides): ParsedTransaction => ({
  id: overrides.id,
  date: new Date(overrides.date),
  description: overrides.description ?? "Sample",
  amount: overrides.amount,
  category: overrides.category ?? (overrides.amount >= 0 ? "Income" : "Expense"),
  source: overrides.source ?? { name: overrides.description ?? "Sample", type: "merchant" },
  broker: overrides.broker,
  currencySymbol: overrides.currencySymbol ?? "€",
  isRecurring: overrides.isRecurring ?? false,
});

describe("detectRecurringTransactions", () => {
  it("identifies monthly recurring transactions from the same source", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-01-05", amount: -15, description: "Netflix" }),
      createTransaction({ id: "b", date: "2024-02-05", amount: -15, description: "Netflix" }),
      createTransaction({ id: "c", date: "2024-03-06", amount: -15, description: "Netflix" }),
      createTransaction({ id: "d", date: "2024-04-05", amount: -15, description: "Netflix" }),
    ];

    const recurringIds = detectRecurringTransactions(transactions);

    expect(recurringIds.size).toBe(4);
    expect(recurringIds.has("a")).toBe(true);
    expect(recurringIds.has("d")).toBe(true);
  });

  it("requires at least three qualifying occurrences in a run", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-01-01", amount: -20, description: "Gym" }),
      createTransaction({ id: "b", date: "2024-02-01", amount: -20, description: "Gym" }),
    ];

    const recurringIds = detectRecurringTransactions(transactions);

    expect(recurringIds.size).toBe(0);
  });

  it("ignores transactions when spacing falls outside the monthly window", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-01-01", amount: -30, description: "Insurance" }),
      createTransaction({ id: "b", date: "2024-03-15", amount: -30, description: "Insurance" }),
      createTransaction({ id: "c", date: "2024-04-15", amount: -30, description: "Insurance" }),
    ];

    const recurringIds = detectRecurringTransactions(transactions);

    expect(recurringIds.size).toBe(0);
  });

  it("tolerates small variations in transaction amount", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-05-10", amount: -19.99, description: "Spotify" }),
      createTransaction({ id: "b", date: "2024-06-09", amount: -20.05, description: "Spotify" }),
      createTransaction({ id: "c", date: "2024-07-10", amount: -20.01, description: "Spotify" }),
    ];

    const recurringIds = detectRecurringTransactions(transactions);

    expect(recurringIds.size).toBe(3);
  });

  it("handles varying monthly amounts without flagging intra-month outliers", () => {
    const transactions = [
      createTransaction({ id: "jan-main", date: "2024-01-25", amount: 2750, description: "Salary" }),
      createTransaction({ id: "feb-main", date: "2024-02-23", amount: 2810, description: "Salary" }),
      createTransaction({ id: "mar-main", date: "2024-03-25", amount: 2795, description: "Salary" }),
      createTransaction({ id: "apr-bonus", date: "2024-04-10", amount: 75, description: "Salary" }),
      createTransaction({ id: "apr-main", date: "2024-04-25", amount: 4100, description: "Salary" }),
      createTransaction({ id: "may-main", date: "2024-05-24", amount: 2840, description: "Salary" }),
      createTransaction({ id: "jun-main", date: "2024-06-25", amount: 2650, description: "Salary" }),
      createTransaction({ id: "jul-main", date: "2024-07-25", amount: 3050, description: "Salary" }),
      createTransaction({ id: "aug-main", date: "2024-08-23", amount: 2875, description: "Salary" }),
      createTransaction({ id: "sep-main", date: "2024-09-25", amount: 2860, description: "Salary" }),
    ];

    const recurringIds = detectRecurringTransactions(transactions);

    [
      "jan-main",
      "feb-main",
      "mar-main",
      "apr-main",
      "may-main",
      "jun-main",
      "jul-main",
      "aug-main",
      "sep-main",
    ].forEach((id) => {
      expect(recurringIds.has(id)).toBe(true);
    });

    expect(recurringIds.has("apr-bonus")).toBe(false);
  });

  it("allows occasional skipped months while keeping the series intact", () => {
    const transactions = [
      createTransaction({ id: "jan", date: "2024-01-25", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "feb", date: "2024-02-26", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "mar", date: "2024-03-25", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "apr", date: "2024-04-25", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "may", date: "2024-05-27", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "jun", date: "2024-06-25", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "jul", date: "2024-07-25", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "aug", date: "2024-08-26", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "oct", date: "2024-10-02", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "nov", date: "2024-11-25", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "dec", date: "2024-12-30", amount: -16.72, description: "Pension" }),
      createTransaction({ id: "jan-25", date: "2025-01-27", amount: -16.72, description: "Pension" }),
    ];

    const recurringIds = detectRecurringTransactions(transactions);

    [
      "oct",
      "nov",
      "dec",
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "jan-25",
    ].forEach((id) => {
      expect(recurringIds.has(id)).toBe(true);
    });
  });
});

describe("applyRecurringDetection", () => {
  it("marks recurring transactions and leaves others untouched", () => {
    const transactions = [
      createTransaction({ id: "r1", date: "2024-01-01", amount: -12, description: "Adobe" }),
      createTransaction({ id: "r2", date: "2024-02-02", amount: -12, description: "Adobe" }),
      createTransaction({ id: "r3", date: "2024-03-03", amount: -12, description: "Adobe" }),
      createTransaction({ id: "r4", date: "2024-01-15", amount: -8, description: "Coffee" }),
    ];

    const annotated = applyRecurringDetection(transactions);
    const recurring = annotated.filter((tx) => tx.description === "Adobe");
    const coffee = annotated.find((tx) => tx.description === "Coffee");

    expect(recurring.every((tx) => tx.isRecurring)).toBe(true);
    expect(coffee?.isRecurring).toBe(false);
  });
});

describe("summarizeRecurringTransactionsForMonth", () => {
  it("returns a single summary per recurring series for the requested month", () => {
    const transactions = [
      createTransaction({ id: "jan", date: "2024-01-15", amount: -25, description: "Gym" }),
      createTransaction({ id: "feb", date: "2024-02-14", amount: -25, description: "Gym" }),
      createTransaction({ id: "mar", date: "2024-03-15", amount: -25, description: "Gym" }),
      createTransaction({ id: "coffee", date: "2024-03-02", amount: -4, description: "Coffee" }),
    ];

    const summaries = summarizeRecurringTransactionsForMonth(
      transactions,
      new Date("2024-03-01")
    );

    expect(summaries).toHaveLength(1);
    expect(summaries[0].representative.id).toBe("mar");
    expect(summaries[0].occurrenceCount).toBe(3);
    expect(summaries[0].occurrenceIds).toEqual(["jan", "feb", "mar"]);
  });

  it("detects recurring series when source metadata is provided", () => {
    const transactions = [
      createTransaction({
        id: "jan",
        date: "2024-01-15",
        amount: -9.99,
        description: "Monthly subscription",
        source: { name: "Subscription", type: "merchant" },
      }),
      createTransaction({
        id: "feb",
        date: "2024-02-14",
        amount: -9.99,
        description: "Monthly subscription",
        source: { name: "Subscription", type: "merchant" },
      }),
      createTransaction({
        id: "mar",
        date: "2024-03-15",
        amount: -9.99,
        description: "Monthly subscription",
        source: { name: "Subscription", type: "merchant" },
      }),
    ];

    const recurringIds = detectRecurringTransactions(transactions);

    expect(Array.from(recurringIds).sort()).toEqual(["feb", "jan", "mar"]);
  });
});
