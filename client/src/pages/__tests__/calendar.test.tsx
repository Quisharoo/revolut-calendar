import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarDayCell from "@/components/CalendarDayCell";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ParsedTransaction } from "@shared/schema";

const sampleTransactions: ParsedTransaction[] = Array.from({ length: 12 }, (_, index) => ({
  id: `sample-${index}`,
  date: new Date("2024-05-18T12:00:00Z"),
  description: `Sample transaction ${index}`,
  amount: index % 2 === 0 ? -(index + 5) : index + 10,
  category: index % 2 === 0 ? "Expense" : "Income",
  broker: index % 2 === 0 ? "Expense Broker" : "Income Broker",
  isRecurring: false,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: vi.fn(),
}));

import CalendarPage from "../calendar";
import { useMediaQuery } from "@/hooks/use-media-query";

vi.mock("@/components/CalendarGrid", () => ({
  __esModule: true,
  default: ({
    onDayClick,
  }: {
    onDayClick?: (date: Date, transactions: ParsedTransaction[]) => void;
  }) => (
    <button
      type="button"
      data-testid="button-open-day"
      onClick={() =>
        onDayClick?.(new Date("2024-05-18T12:00:00Z"), sampleTransactions)
      }
    >
      Open Day Detail
    </button>
  ),
}));

describe("CalendarPage day detail interactions", () => {
  const mediaQueryMock = vi.mocked(useMediaQuery);

  beforeEach(() => {
    mediaQueryMock.mockReset();
    mediaQueryMock.mockReturnValue(true);
  });

  it("renders desktop side panel without sheet dialog and respects overlay close", async () => {
    const user = userEvent.setup();

    render(<CalendarPage transactions={sampleTransactions} />);

    // On desktop, there are two buttons (mobile hidden, desktop visible)
    // Click the first one which should trigger the handler
    const buttons = screen.getAllByTestId("button-open-day");
    await user.click(buttons[0]);

    const panel = await screen.findByTestId("panel-day-detail");
    expect(panel).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(panel);
    expect(screen.getByTestId("panel-day-detail")).toBeInTheDocument();

    await user.click(screen.getByTestId("overlay-backdrop"));
    await waitFor(() => {
      expect(screen.queryByTestId("panel-day-detail")).not.toBeInTheDocument();
    });
  });

  it("uses a sheet dialog on mobile widths and closes via the panel control", async () => {
    const user = userEvent.setup();
    mediaQueryMock.mockReturnValue(false);

    render(<CalendarPage transactions={sampleTransactions} />);

    // On mobile, there are still two buttons but we only need to click one
    const buttons = screen.getAllByTestId("button-open-day");
    await user.click(buttons[0]);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.queryByTestId("panel-day-detail")).not.toBeInTheDocument();

    await user.click(dialog);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.click(await screen.findByTestId("button-close-panel"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("CalendarDayCell summary display", () => {
  it("shows transaction count when transactions exist", () => {
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={sampleTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByTestId("text-transaction-count")).toHaveTextContent(
      String(sampleTransactions.length)
    );
  });

  it("displays income summary card with correct total", () => {
    const incomeTransactions: ParsedTransaction[] = [
      {
        id: "income-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Salary",
        amount: 5000,
        category: "Income",
        broker: "Employer",
        isRecurring: false,
      },
      {
        id: "income-2",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Bonus",
        amount: 1500,
        category: "Income",
        broker: "Employer",
        isRecurring: false,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={incomeTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const incomeCard = screen.getByTestId("preview-income-summary");
    expect(incomeCard).toBeInTheDocument();
    expect(incomeCard).toHaveTextContent("Income");
    expect(incomeCard).toHaveTextContent("$6,500.00");
  });

  it("displays expense summary card with correct total", () => {
    const expenseTransactions: ParsedTransaction[] = [
      {
        id: "expense-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Rent",
        amount: -1800,
        category: "Expense",
        broker: "Landlord",
        isRecurring: true,
      },
      {
        id: "expense-2",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Groceries",
        amount: -120.50,
        category: "Expense",
        broker: "Whole Foods",
        isRecurring: false,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={expenseTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const expenseCard = screen.getByTestId("preview-expense-summary");
    expect(expenseCard).toBeInTheDocument();
    expect(expenseCard).toHaveTextContent("Expenses");
    expect(expenseCard).toHaveTextContent("-$1,920.50");
  });

  it("displays both income and expense cards when both exist", () => {
    const mixedTransactions: ParsedTransaction[] = [
      {
        id: "income-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Salary",
        amount: 5000,
        category: "Income",
        broker: "Employer",
        isRecurring: false,
      },
      {
        id: "expense-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Rent",
        amount: -1800,
        category: "Expense",
        broker: "Landlord",
        isRecurring: true,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={mixedTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByTestId("preview-income-summary")).toBeInTheDocument();
    expect(screen.getByTestId("preview-expense-summary")).toBeInTheDocument();
    
    expect(screen.getByTestId("preview-income-summary")).toHaveTextContent("$5,000.00");
    expect(screen.getByTestId("preview-expense-summary")).toHaveTextContent("-$1,800.00");
  });

  it("does not display income card when no income transactions exist", () => {
    const expenseTransactions: ParsedTransaction[] = [
      {
        id: "expense-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Rent",
        amount: -1800,
        category: "Expense",
        broker: "Landlord",
        isRecurring: true,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={expenseTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.queryByTestId("preview-income-summary")).not.toBeInTheDocument();
    expect(screen.getByTestId("preview-expense-summary")).toBeInTheDocument();
  });

  it("does not display expense card when no expense transactions exist", () => {
    const incomeTransactions: ParsedTransaction[] = [
      {
        id: "income-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Salary",
        amount: 5000,
        category: "Income",
        broker: "Employer",
        isRecurring: false,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={incomeTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByTestId("preview-income-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("preview-expense-summary")).not.toBeInTheDocument();
  });

  it("does not display any summary cards when no transactions exist", () => {
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={[]}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.queryByTestId("preview-income-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("preview-expense-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("text-transaction-count")).not.toBeInTheDocument();
  });

  it("correctly categorizes transactions by amount sign regardless of category field", () => {
    const transactions: ParsedTransaction[] = [
      {
        id: "positive-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Income Item",
        amount: 1000,
        category: "Expense", // Wrong category but positive amount
        broker: "Test",
        isRecurring: false,
      },
      {
        id: "negative-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Expense Item",
        amount: -500,
        category: "Income", // Wrong category but negative amount
        broker: "Test",
        isRecurring: false,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={transactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    // Should be categorized by amount sign, not category field
    expect(screen.getByTestId("preview-income-summary")).toHaveTextContent("$1,000.00");
    expect(screen.getByTestId("preview-expense-summary")).toHaveTextContent("-$500.00");
  });

  it("handles large transaction amounts without overflow", () => {
    const largeTransactions: ParsedTransaction[] = [
      {
        id: "large-income",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Big Payment",
        amount: 999999.99,
        category: "Income",
        broker: "Client",
        isRecurring: false,
      },
      {
        id: "large-expense",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Big Purchase",
        amount: -888888.88,
        category: "Expense",
        broker: "Vendor",
        isRecurring: false,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={largeTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const incomeCard = screen.getByTestId("preview-income-summary");
    const expenseCard = screen.getByTestId("preview-expense-summary");

    // Verify amounts are displayed
    expect(incomeCard).toHaveTextContent("$999,999.99");
    expect(expenseCard).toHaveTextContent("-$888,888.88");

    // Verify the card structure prevents overflow
    const incomeAmount = incomeCard.querySelector('p.text-sm');
    const expenseAmount = expenseCard.querySelector('p.text-sm');
    
    expect(incomeAmount).toBeInTheDocument();
    expect(expenseAmount).toBeInTheDocument();
  });

  it("handles zero amounts correctly", () => {
    const zeroTransactions: ParsedTransaction[] = [
      {
        id: "zero-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Zero amount",
        amount: 0,
        category: "Income",
        broker: "Test",
        isRecurring: false,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={zeroTransactions}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    // Zero amounts should not show any cards
    expect(screen.queryByTestId("preview-income-summary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("preview-expense-summary")).not.toBeInTheDocument();
  });

  it("sums multiple transactions of the same type correctly", () => {
    const multipleIncomes: ParsedTransaction[] = [
      {
        id: "income-1",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Payment 1",
        amount: 100.50,
        category: "Income",
        broker: "Client A",
        isRecurring: false,
      },
      {
        id: "income-2",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Payment 2",
        amount: 200.25,
        category: "Income",
        broker: "Client B",
        isRecurring: false,
      },
      {
        id: "income-3",
        date: new Date("2024-05-18T12:00:00Z"),
        description: "Payment 3",
        amount: 50.00,
        category: "Income",
        broker: "Client C",
        isRecurring: false,
      },
    ];

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={multipleIncomes}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    // Should sum to 350.75
    expect(screen.getByTestId("preview-income-summary")).toHaveTextContent("$350.75");
  });
});

describe("CalendarDayCell interactions and styling", () => {
  it("calls onClick handler when cell is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={sampleTransactions}
          isCurrentMonth
          onClick={handleClick}
        />
      </TooltipProvider>
    );

    await user.click(screen.getByTestId("cell-day-18"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("displays day number correctly", () => {
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={[]}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByTestId("text-day-number")).toHaveTextContent("18");
  });

  it("applies opacity when not in current month", () => {
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={sampleTransactions}
          isCurrentMonth={false}
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const cell = screen.getByTestId("cell-day-18");
    expect(cell).toHaveClass("opacity-40");
  });

  it("does not apply opacity when in current month", () => {
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={sampleTransactions}
          isCurrentMonth={true}
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const cell = screen.getByTestId("cell-day-18");
    expect(cell).not.toHaveClass("opacity-40");
  });

  it("applies selected styling when isSelected is true", () => {
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={sampleTransactions}
          isCurrentMonth
          isSelected={true}
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const cell = screen.getByTestId("cell-day-18");
    expect(cell).toHaveClass("ring-2", "ring-primary", "ring-inset");
  });

  it("does not apply selected styling when isSelected is false", () => {
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={sampleTransactions}
          isCurrentMonth
          isSelected={false}
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const cell = screen.getByTestId("cell-day-18");
    expect(cell).not.toHaveClass("ring-2");
  });

  it("highlights today's date with special styling", () => {
    const today = new Date();
    
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={today}
          transactions={[]}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const dayNumber = screen.getByTestId("text-day-number");
    expect(dayNumber).toHaveClass("bg-primary", "text-primary-foreground");
  });

  it("does not highlight non-today dates", () => {
    const notToday = new Date("2024-01-01T12:00:00Z");
    
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={notToday}
          transactions={[]}
          isCurrentMonth
          onClick={vi.fn()}
        />
      </TooltipProvider>
    );

    const dayNumber = screen.getByTestId("text-day-number");
    expect(dayNumber).not.toHaveClass("bg-primary");
    expect(dayNumber).toHaveClass("text-foreground");
  });
});
