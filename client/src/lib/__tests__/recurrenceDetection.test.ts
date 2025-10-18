import { describe, expect, it } from "vitest";
import type { ParsedTransaction } from "@shared/schema";
import { CONTRACT_VERSION } from "@shared/version";
import {
  applyRecurringDetection,
  detectRecurringSeries,
} from "../recurrenceDetection";

type TransactionOverrides = {
  id: string;
  date: string;
  amount: number;
  description?: string;
  category?: ParsedTransaction["category"];
  source?: ParsedTransaction["source"];
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
  currencySymbol: overrides.currencySymbol ?? "€",
  isRecurring: overrides.isRecurring ?? false,
  contractVersion: CONTRACT_VERSION,
});

describe("detectRecurringSeries", () => {
  it("identifies monthly recurring transactions from the same source", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-01-05", amount: -15, description: "Netflix" }),
      createTransaction({ id: "b", date: "2024-02-05", amount: -15, description: "Netflix" }),
      createTransaction({ id: "c", date: "2024-03-06", amount: -15, description: "Netflix" }),
      createTransaction({ id: "d", date: "2024-04-05", amount: -15, description: "Netflix" }),
    ];

    const { series } = detectRecurringSeries(transactions);

    expect(series).toHaveLength(1);
    expect(series[0]?.transactionIds).toEqual(["a", "b", "c", "d"]);
  });

  it("requires at least three qualifying occurrences in a run", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-01-01", amount: -20, description: "Gym" }),
      createTransaction({ id: "b", date: "2024-02-01", amount: -20, description: "Gym" }),
    ];

    const { series } = detectRecurringSeries(transactions);

    expect(series).toHaveLength(0);
  });

  it("ignores transactions when spacing falls outside the monthly window", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-01-01", amount: -30, description: "Insurance" }),
      createTransaction({ id: "b", date: "2024-03-15", amount: -30, description: "Insurance" }),
      createTransaction({ id: "c", date: "2024-04-15", amount: -30, description: "Insurance" }),
    ];

    const { series } = detectRecurringSeries(transactions);

    expect(series).toHaveLength(0);
  });

  it("tolerates small variations in transaction amount", () => {
    const transactions = [
      createTransaction({ id: "a", date: "2024-01-10", amount: -19.99, description: "Spotify" }),
      createTransaction({ id: "b", date: "2024-02-09", amount: -20.05, description: "Spotify" }),
      createTransaction({ id: "c", date: "2024-03-10", amount: -20.01, description: "Spotify" }),
      createTransaction({ id: "d", date: "2024-04-10", amount: -19.98, description: "Spotify" }),
    ];

    const { series } = detectRecurringSeries(transactions);

    expect(series).toHaveLength(1);
    expect(series[0]?.transactionIds).toEqual(["a", "b", "c", "d"]);
  });
});

describe("applyRecurringDetection", () => {
  it("marks recurring transactions and leaves others untouched", () => {
    const transactions = [
      createTransaction({ id: "r1", date: "2024-01-01", amount: -12, description: "Adobe" }),
      createTransaction({ id: "r2", date: "2024-02-02", amount: -12, description: "Adobe" }),
      createTransaction({ id: "r3", date: "2024-03-03", amount: -12, description: "Adobe" }),
      createTransaction({ id: "r4", date: "2024-04-03", amount: -12, description: "Adobe" }),
      createTransaction({ id: "c1", date: "2024-01-15", amount: -8, description: "Coffee" }),
    ];

    const { transactions: annotated, series } = applyRecurringDetection(transactions);
    const recurring = annotated.filter((tx) => tx.description === "Adobe");
    const coffee = annotated.find((tx) => tx.description === "Coffee");

    expect(recurring.every((tx) => tx.isRecurring)).toBe(true);
    expect(coffee?.isRecurring).toBe(false);
    expect(series).toHaveLength(1);
  });
});
