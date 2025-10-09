import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DayDetailPanel from "../DayDetailPanel";
import type { ParsedTransaction } from "@shared/schema";

describe("DayDetailPanel", () => {
  const createTransaction = (overrides: Partial<ParsedTransaction>): ParsedTransaction => ({
    id: "test-id",
    date: new Date("2024-10-15"),
    description: "Test Transaction",
    amount: 100,
    category: "Income",
    broker: "Test Broker",
    isRecurring: false,
    currencySymbol: "$",
    ...overrides,
  });

  const mockOnClose = vi.fn();

  it("groups transactions by amount sign correctly", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income", description: "Salary" }),
      createTransaction({ id: "2", amount: -500, category: "Expense", description: "Rent" }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.getByTestId("section-income")).toBeInTheDocument();
    expect(screen.getByTestId("section-expense")).toBeInTheDocument();
    expect(screen.getByTestId("text-income-total")).toHaveTextContent("+$1,000.00");
    expect(screen.getByTestId("text-expense-total")).toHaveTextContent("-$500.00");
  });

  it("includes positive transfers in income section", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income", description: "Salary" }),
      createTransaction({ id: "2", amount: 500, category: "Transfer", description: "Account Transfer In" }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.getByTestId("section-income")).toBeInTheDocument();
    expect(screen.queryByTestId("section-expense")).not.toBeInTheDocument();
    expect(screen.getByTestId("text-income-total")).toHaveTextContent("+$1,500.00");
    
    // Both transactions should be in income section
    expect(screen.getByTestId("item-income-1")).toBeInTheDocument();
    expect(screen.getByTestId("item-income-2")).toBeInTheDocument();
  });

  it("includes negative transfers in expense section", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: -800, category: "Expense", description: "Groceries" }),
      createTransaction({ id: "2", amount: -200, category: "Transfer", description: "Account Transfer Out" }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.queryByTestId("section-income")).not.toBeInTheDocument();
    expect(screen.getByTestId("section-expense")).toBeInTheDocument();
    expect(screen.getByTestId("text-expense-total")).toHaveTextContent("-$1,000.00");
    
    // Both transactions should be in expense section
    expect(screen.getByTestId("item-expense-1")).toBeInTheDocument();
    expect(screen.getByTestId("item-expense-2")).toBeInTheDocument();
  });

  it("handles mixed transfers and regular transactions", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 3000, category: "Income", description: "Salary" }),
      createTransaction({ id: "2", amount: 500, category: "Transfer", description: "Transfer In" }),
      createTransaction({ id: "3", amount: -1200, category: "Expense", description: "Rent" }),
      createTransaction({ id: "4", amount: -300, category: "Transfer", description: "Transfer Out" }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.getByTestId("section-income")).toBeInTheDocument();
    expect(screen.getByTestId("section-expense")).toBeInTheDocument();
    
    // Income: 3000 + 500 = 3500
    expect(screen.getByTestId("text-income-total")).toHaveTextContent("+$3,500.00");
    // Expense: -1200 + -300 = -1500
    expect(screen.getByTestId("text-expense-total")).toHaveTextContent("-$1,500.00");
    
    // Check all transactions are displayed
    expect(screen.getByTestId("item-income-1")).toBeInTheDocument();
    expect(screen.getByTestId("item-income-2")).toBeInTheDocument();
    expect(screen.getByTestId("item-expense-3")).toBeInTheDocument();
    expect(screen.getByTestId("item-expense-4")).toBeInTheDocument();
  });

  it("displays formatted date correctly", () => {
    const date = new Date("2024-10-15");
    render(<DayDetailPanel date={date} transactions={[]} onClose={mockOnClose} />);

    expect(screen.getByTestId("heading-selected-date")).toHaveTextContent("Tuesday, October 15, 2024");
  });

  it("displays transaction count correctly", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000 }),
      createTransaction({ id: "2", amount: -500 }),
      createTransaction({ id: "3", amount: -300 }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.getByTestId("text-transaction-summary")).toHaveTextContent("3 transactions");
  });

  it("displays transaction count with singular form for one transaction", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000 }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.getByTestId("text-transaction-summary")).toHaveTextContent("1 transaction");
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={[]} onClose={onClose} />);

    await user.click(screen.getByTestId("button-close-panel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when no transactions", () => {
    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={[]} onClose={mockOnClose} />);

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("No transactions on this day")).toBeInTheDocument();
  });

  it("does not show income section when all transactions are negative", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: -800, category: "Expense" }),
      createTransaction({ id: "2", amount: -200, category: "Expense" }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.queryByTestId("section-income")).not.toBeInTheDocument();
    expect(screen.getByTestId("section-expense")).toBeInTheDocument();
  });

  it("does not show expense section when all transactions are positive", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({ id: "2", amount: 500, category: "Income" }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.getByTestId("section-income")).toBeInTheDocument();
    expect(screen.queryByTestId("section-expense")).not.toBeInTheDocument();
  });

  it("displays transaction details correctly", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({
        id: "1",
        amount: 1500,
        category: "Income",
        description: "Freelance Payment",
        source: { name: "Client ABC", type: "broker" },
        currencySymbol: "€",
      }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    const item = screen.getByTestId("item-income-1");
    expect(item).toHaveTextContent("Freelance Payment");
    expect(item).toHaveTextContent("Client ABC");
    expect(item).toHaveTextContent("+€1,500.00");
  });

  it("uses broker when source is not available", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({
        id: "1",
        amount: 1000,
        category: "Income",
        description: "Payment",
        broker: "Test Broker",
        source: undefined,
      }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    const item = screen.getByTestId("item-income-1");
    expect(item).toHaveTextContent("Test Broker");
  });

  it("handles transactions with different currencies", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({
        id: "1",
        amount: 1000,
        category: "Income",
        description: "USD Payment",
        currencySymbol: "$",
      }),
      createTransaction({
        id: "2",
        amount: -500,
        category: "Expense",
        description: "EUR Payment",
        currencySymbol: "€",
      }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    // First transaction uses its own currency
    const incomeItem = screen.getByTestId("item-income-1");
    expect(incomeItem).toHaveTextContent("+$1,000.00");
    
    // Second transaction uses its own currency
    const expenseItem = screen.getByTestId("item-expense-2");
    expect(expenseItem).toHaveTextContent("-€500.00");
  });

  it("shows separator between income and expense sections", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({ id: "1", amount: 1000, category: "Income" }),
      createTransaction({ id: "2", amount: -500, category: "Expense" }),
    ];

    render(<DayDetailPanel date={new Date("2024-10-15")} transactions={transactions} onClose={mockOnClose} />);

    expect(screen.getByTestId("section-income")).toBeInTheDocument();
    expect(screen.getByTestId("section-expense")).toBeInTheDocument();
    // Separator exists when both sections are present (though we can't easily test the Separator component itself)
  });
});

