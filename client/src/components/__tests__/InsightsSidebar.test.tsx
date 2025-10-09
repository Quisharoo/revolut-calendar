import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InsightsSidebar from "../InsightsSidebar";
import type { ParsedTransaction } from "@shared/schema";

describe("InsightsSidebar", () => {
  const createTransaction = (overrides: Partial<ParsedTransaction>): ParsedTransaction => ({
    id: "test-id",
    date: new Date("2024-10-01"),
    description: "Test Transaction",
    amount: 100,
    category: "Income",
    broker: "Test Broker",
    isRecurring: false,
    currencySymbol: "$",
    ...overrides,
  });

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

  it("excludes positive transfer transactions from income totals", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({ id: "2", amount: 500, category: "Transfer" }), // Positive transfer
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$1,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$1,000.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("+$0.00");
    expect(screen.getByTestId("text-total-transfer")).toHaveTextContent("+$500.00");

    expect(screen.getByTestId("text-category-income-count")).toHaveTextContent("1 transaction");
    expect(screen.getByTestId("text-category-transfer-count")).toHaveTextContent("1 transaction");
  });

  it("excludes negative transfer transactions from expense totals", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: -800, category: "Expense" }),
      createTransaction({ id: "2", amount: -200, category: "Transfer" }), // Negative transfer
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("-$800.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$0.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("-$800.00");
    expect(screen.getByTestId("text-total-transfer")).toHaveTextContent("-$200.00");

    expect(screen.getByTestId("text-category-expense-count")).toHaveTextContent("1 transaction");
    expect(screen.getByTestId("text-category-transfer-count")).toHaveTextContent("1 transaction");
  });

  it("handles mixed transfers correctly", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 3000, category: "Income" }),
      createTransaction({ id: "2", amount: 500, category: "Transfer" }), // Positive transfer
      createTransaction({ id: "3", amount: -1000, category: "Expense" }),
      createTransaction({ id: "4", amount: -200, category: "Transfer" }), // Negative transfer
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$2,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$3,000.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("-$1,000.00");
    expect(screen.getByTestId("text-total-transfer")).toHaveTextContent("+$300.00");

    expect(screen.getByTestId("text-category-income-total")).toHaveTextContent("+$3,000.00");
    expect(screen.getByTestId("text-category-expense-total")).toHaveTextContent("-$1,000.00");
    expect(screen.getByTestId("text-category-transfer-total")).toHaveTextContent("+$300.00");
  });

  it("displays correct transaction counts in category breakdown", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({ id: "2", amount: 500, category: "Income" }),
      createTransaction({ id: "3", amount: 300, category: "Transfer" }), // Positive
      createTransaction({ id: "4", amount: -800, category: "Expense" }),
      createTransaction({ id: "5", amount: -200, category: "Transfer" }), // Negative
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-category-income-count")).toHaveTextContent("2 transactions");
    expect(screen.getByTestId("text-category-expense-count")).toHaveTextContent("1 transaction");
    expect(screen.getByTestId("text-category-transfer-count")).toHaveTextContent("2 transactions");
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
      createTransaction({ id: "1", amount: 0, category: "Transfer" }),
      createTransaction({ id: "2", amount: 1000, category: "Income" }),
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    // Zero amount should not affect income or expense
    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$1,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$1,000.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("+$0.00");
    expect(screen.getByTestId("text-total-transfer")).toHaveTextContent("+$0.00");
  });

  it("calculates category breakdown totals correctly with transfers", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 2000, category: "Income" }),
      createTransaction({ id: "2", amount: 750, category: "Transfer" }), // Positive
      createTransaction({ id: "3", amount: -1200, category: "Expense" }),
      createTransaction({ id: "4", amount: -300, category: "Transfer" }), // Negative
    ];

    render(<InsightsSidebar transactions={transactions} currentMonth="October" />);

    expect(screen.getByTestId("text-category-income-total")).toHaveTextContent("+$2,000.00");
    expect(screen.getByTestId("text-category-expense-total")).toHaveTextContent("-$1,200.00");
    expect(screen.getByTestId("text-category-transfer-total")).toHaveTextContent("+$450.00");
  });
});
