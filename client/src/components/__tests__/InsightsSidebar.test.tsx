import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InsightsSidebar from "../InsightsSidebar";
import type { ParsedTransaction } from "@shared/schema";
import { CONTRACT_VERSION } from "@shared/version";

describe("InsightsSidebar", () => {
  const createTransaction = (overrides: Partial<ParsedTransaction>): ParsedTransaction => {
    const category = overrides.category ?? "Income";
    const description = overrides.description ?? "Test Transaction";
    const source =
      overrides.source ?? {
        name: description,
        type: category === "Income" ? "broker" : "merchant",
      };

    return {
      id: "test-id",
      date: new Date("2024-10-01"),
      description,
      amount: 100,
      category,
      isRecurring: false,
      currencySymbol: "$",
      contractVersion: CONTRACT_VERSION,
      ...overrides,
      source,
    };
  };

  it("calculates totals correctly with only income transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({ id: "2", amount: 500, category: "Income" }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$1,500.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$1,500.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("+$0.00");
  });

  it("calculates totals correctly with only expense transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: -800, category: "Expense" }),
      createTransaction({ id: "2", amount: -200, category: "Expense" }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("-$1,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$0.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("-$1,000.00");
  });

  it("calculates net total correctly with mixed income and expenses", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 5000, category: "Income" }),
      createTransaction({ id: "2", amount: -1800, category: "Expense" }),
      createTransaction({ id: "3", amount: -300, category: "Expense" }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$2,900.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$5,000.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("-$2,100.00");
  });

  it("counts transfer-like income transactions within income totals", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({
        id: "2",
        amount: 500,
        category: "Income",
        description: "Transfer from Savings",
      }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$1,500.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$1,500.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("+$0.00");
    expect(screen.queryByTestId("text-total-transfer")).toBeNull();
  });

  it("counts transfer-like expense transactions within expense totals", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: -800, category: "Expense" }),
      createTransaction({
        id: "2",
        amount: -200,
        category: "Expense",
        description: "Transfer to Savings",
      }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("-$1,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$0.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("-$1,000.00");
    expect(screen.queryByTestId("text-total-transfer")).toBeNull();
  });

  it("aggregates mixed transfer-like activity with other transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 3000, category: "Income" }),
      createTransaction({
        id: "2",
        amount: 500,
        category: "Income",
        description: "Transfer from Brokerage",
      }),
      createTransaction({ id: "3", amount: -1000, category: "Expense" }),
      createTransaction({
        id: "4",
        amount: -200,
        category: "Expense",
        description: "Transfer to Savings",
      }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$2,300.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$3,500.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("-$1,200.00");
    expect(screen.queryByTestId("text-total-transfer")).toBeNull();
  });

  it("displays correct transaction counts in category breakdown", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({ id: "2", amount: 500, category: "Income" }),
      createTransaction({
        id: "3",
        amount: 300,
        category: "Income",
        description: "Transfer from Credit Card",
      }),
      createTransaction({ id: "4", amount: -800, category: "Expense" }),
      createTransaction({
        id: "5",
        amount: -200,
        category: "Expense",
        description: "Transfer to Brokerage",
      }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-category-income-count")).toHaveTextContent("3 transactions");
    expect(screen.getByTestId("text-category-expense-count")).toHaveTextContent("2 transactions");
    expect(screen.queryByTestId("text-category-transfer-count")).toBeNull();
  });

  it("handles recurring transaction count correctly", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income", isRecurring: true }),
      createTransaction({ id: "2", amount: -800, category: "Expense", isRecurring: true }),
      createTransaction({ id: "3", amount: -200, category: "Expense", isRecurring: false }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-recurring-count")).toHaveTextContent("2 items");
  });

  it("displays correct currency symbol from transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income", currencySymbol: "€" }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+€1,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+€1,000.00");
  });

  it("uses default currency symbol when transactions array is empty", () => {
    render(<InsightsSidebar transactions={[]} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$0.00");
  });

  it("displays the correct month name", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="December" />);

    expect(screen.getByTestId("heading-month")).toHaveTextContent("December Summary");
  });

  it("handles zero-amount transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({
        id: "1",
        amount: 0,
        category: "Income",
        description: "Zero transfer",
      }),
      createTransaction({ id: "2", amount: 1000, category: "Income" }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    // Zero amount should not affect income or expense
    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$1,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$1,000.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("+$0.00");
    expect(screen.queryByTestId("text-total-transfer")).toBeNull();
  });

  it("calculates category breakdown totals including transfer-like data", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 2000, category: "Income" }),
      createTransaction({
        id: "2",
        amount: 750,
        category: "Income",
        description: "Transfer from Brokerage",
      }),
      createTransaction({ id: "3", amount: -1200, category: "Expense" }),
      createTransaction({
        id: "4",
        amount: -300,
        category: "Expense",
        description: "Transfer to Savings",
      }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-category-income-total")).toHaveTextContent("+$2,750.00");
    expect(screen.getByTestId("text-category-expense-total")).toHaveTextContent("-$1,500.00");
    expect(screen.queryByTestId("text-category-transfer-total")).toBeNull();
  });
});
