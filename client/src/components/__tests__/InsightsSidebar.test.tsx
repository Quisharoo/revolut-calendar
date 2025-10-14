import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import InsightsSidebar from "../InsightsSidebar";
import type { ParsedTransaction } from "@shared/schema";

const toEuros = (value: number) => Number(value.toFixed(2));

describe("InsightsSidebar", () => {
  const createTransaction = (
    overrides: Partial<ParsedTransaction>
  ): ParsedTransaction => ({
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

  const renderSidebar = (
    props?: Partial<ComponentProps<typeof InsightsSidebar>>
  ) => {
    const defaultProps: ComponentProps<typeof InsightsSidebar> = {
      transactions: [],
      currentMonth: "October",
      surprises: [],
      isSurprisesOnly: false,
      onToggleSurprises: () => {},
    };

    render(<InsightsSidebar {...defaultProps} {...props} />);
  };

  it("calculates totals correctly with only income transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({ id: "2", amount: 500, category: "Income" }),
    ];

    renderSidebar({ transactions });

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$1,500.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+$1,500.00");
    expect(screen.getByTestId("text-total-expense")).toHaveTextContent("+$0.00");
  });

  it("calculates totals correctly with only expense transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: -800, category: "Expense" }),
      createTransaction({ id: "2", amount: -200, category: "Expense" }),
    ];

    renderSidebar({ transactions });

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

    renderSidebar({ transactions });

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

    renderSidebar({ transactions });

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

    renderSidebar({ transactions });

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

    renderSidebar({ transactions });

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

    renderSidebar({ transactions });

    expect(screen.getByTestId("text-category-income-count")).toHaveTextContent(
      "3 transactions"
    );
    expect(screen.getByTestId("text-category-expense-count")).toHaveTextContent(
      "2 transactions"
    );
    expect(screen.queryByTestId("text-category-transfer-count")).toBeNull();
  });

  it("handles recurring transaction count correctly", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income", isRecurring: true }),
      createTransaction({ id: "2", amount: -800, category: "Expense", isRecurring: true }),
      createTransaction({ id: "3", amount: -200, category: "Expense", isRecurring: false }),
    ];

    renderSidebar({ transactions });

    expect(screen.getByTestId("text-recurring-count")).toHaveTextContent("2 items");
  });

  it("displays correct currency symbol from transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income", currencySymbol: "€" }),
    ];

    renderSidebar({ transactions });

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+€1,000.00");
    expect(screen.getByTestId("text-total-income")).toHaveTextContent("+€1,000.00");
  });

  it("uses default currency symbol when transactions array is empty", () => {
    renderSidebar();

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+$0.00");
  });

  it("displays the correct month name", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
    ];

    renderSidebar({ transactions, currentMonth: "December" });

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

    renderSidebar({ transactions });

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

    renderSidebar({ transactions });

    expect(screen.getByTestId("text-category-income-total")).toHaveTextContent(
      "+$2,750.00"
    );
    expect(screen.getByTestId("text-category-expense-total")).toHaveTextContent(
      "-$1,500.00"
    );
    expect(screen.queryByTestId("text-category-transfer-total")).toBeNull();
  });

  it("displays surprises list when anomalies are provided", () => {
    const transaction = createTransaction({ id: "surprise-1", amount: 4200 });
    const surprise = {
      transaction,
      category: transaction.category,
      deviation: 3100,
      score: 3.5,
      median: 1100,
      mad: toEuros(885.71),
    };

    renderSidebar({ transactions: [transaction], surprises: [surprise] });

    expect(screen.getByTestId("heading-surprises")).toBeInTheDocument();
    expect(screen.getByTestId("button-toggle-surprises")).toHaveTextContent(
      "Show surprises"
    );
    expect(
      screen.getByTestId("item-surprise-surprise-1")
    ).toBeInTheDocument();
  });

  it("shows active toggle label when filtering to surprises", () => {
    renderSidebar({ isSurprisesOnly: true });

    expect(screen.getByTestId("button-toggle-surprises")).toHaveTextContent(
      "Viewing surprises"
    );
  });

  it("falls back to surprise currency when no transactions present", () => {
    const transaction = createTransaction({
      id: "surprise-euro",
      amount: 2500,
      currencySymbol: "€",
    });
    const surprise = {
      transaction,
      category: transaction.category,
      deviation: 1500,
      score: 3.2,
      median: 1000,
      mad: toEuros(468.75),
    };

    renderSidebar({ surprises: [surprise] });

    expect(screen.getByTestId("text-net-total")).toHaveTextContent("+€0.00");
  });
});
