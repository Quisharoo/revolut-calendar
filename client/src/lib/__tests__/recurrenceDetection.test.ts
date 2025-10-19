import { describe, expect, it } from "vitest";
import type { ParsedTransaction } from "@shared/schema";
import {
  detectRecurringSeries,
  annotateTransactionsWithRecurrence,
  selectSeriesForMonth,
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
};

const createTransaction = (overrides: TransactionOverrides): ParsedTransaction => ({
  id: overrides.id,
  date: new Date(overrides.date),
  description: overrides.description ?? "Sample",
  amount: overrides.amount,
  category: overrides.category ?? (overrides.amount >= 0 ? "Income" : "Expense"),
  source: overrides.source ?? {
    name: overrides.description ?? "Sample",
    type: "merchant",
  },
  broker: overrides.broker,
  currencySymbol: overrides.currencySymbol ?? "€",
  isRecurring: false,
});

describe("detectRecurringSeries", () => {
  it("groups monthly recurring transactions by source label and direction", () => {
    const transactions = [
      createTransaction({ id: "jan", date: "2024-01-05", amount: -15, description: "Netflix" }),
      createTransaction({ id: "feb", date: "2024-02-05", amount: -15, description: "Netflix" }),
      createTransaction({ id: "mar", date: "2024-03-06", amount: -15, description: "Netflix" }),
      createTransaction({ id: "apr", date: "2024-04-05", amount: -15, description: "Netflix" }),
      createTransaction({ id: "coffee", date: "2024-02-07", amount: -4.2, description: "Coffee" }),
    ];

    const { series, orphanIds } = detectRecurringSeries(transactions);

    expect(series).toHaveLength(1);
    expect(series[0].transactions.map((tx) => tx.id)).toEqual(["jan", "feb", "mar", "apr"]);
    expect(orphanIds).toContain("coffee");
  });

  it("requires a minimum number of occurrences", () => {
    const transactions = [
      createTransaction({ id: "jan", date: "2024-01-05", amount: -25, description: "Gym" }),
      createTransaction({ id: "feb", date: "2024-02-06", amount: -25, description: "Gym" }),
    ];

    const { series } = detectRecurringSeries(transactions);
    expect(series).toHaveLength(0);
  });

  it("tolerates amount variance within the configured percentage", () => {
    const transactions = [
      createTransaction({ id: "jan", date: "2024-01-01", amount: -19.99, description: "Spotify" }),
      createTransaction({ id: "feb", date: "2024-02-01", amount: -20.05, description: "Spotify" }),
      createTransaction({ id: "mar", date: "2024-03-01", amount: -20.02, description: "Spotify" }),
      createTransaction({ id: "apr", date: "2024-04-01", amount: -20.01, description: "Spotify" }),
    ];

    const { series } = detectRecurringSeries(transactions);

    expect(series).toHaveLength(1);
    expect(series[0].transactions).toHaveLength(4);
  });
});

describe("annotateTransactionsWithRecurrence", () => {
  it("marks recurring transactions while leaving others false", () => {
    const transactions = [
      createTransaction({ id: "jan", date: "2024-01-01", amount: -12, description: "Adobe" }),
      createTransaction({ id: "feb", date: "2024-02-01", amount: -12, description: "Adobe" }),
      createTransaction({ id: "mar", date: "2024-03-01", amount: -12, description: "Adobe" }),
      createTransaction({ id: "apr", date: "2024-04-01", amount: -12, description: "Adobe" }),
      createTransaction({ id: "coffee", date: "2024-03-10", amount: -4, description: "Coffee" }),
    ];

    const detection = detectRecurringSeries(transactions);
    const annotated = annotateTransactionsWithRecurrence(transactions, detection.series);

    const recurring = annotated.filter((tx) => tx.description === "Adobe");
    expect(recurring.every((tx) => tx.isRecurring)).toBe(true);
    expect(annotated.find((tx) => tx.id === "coffee")?.isRecurring).toBe(false);
  });
});

describe("selectSeriesForMonth", () => {
  it("returns series with a representative for the requested month", () => {
    const transactions = [
      createTransaction({ id: "jan", date: "2024-01-15", amount: -25, description: "Gym" }),
      createTransaction({ id: "feb", date: "2024-02-14", amount: -25, description: "Gym" }),
      createTransaction({ id: "mar", date: "2024-03-15", amount: -25, description: "Gym" }),
      createTransaction({ id: "apr", date: "2024-04-15", amount: -25, description: "Gym" }),
      createTransaction({ id: "coffee", date: "2024-03-02", amount: -4, description: "Coffee" }),
    ];

    const { series } = detectRecurringSeries(transactions);
    const marchSeries = selectSeriesForMonth(series, new Date("2024-03-01"));

    expect(marchSeries).toHaveLength(1);
    expect(marchSeries[0].representative.id).toBe("mar");
  });
});
