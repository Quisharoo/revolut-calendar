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
  source: {
    name: index % 2 === 0 ? "Expense Broker" : "Income Broker",
    type: index % 2 === 0 ? "merchant" : "broker",
  },
  isRecurring: false,
}));

const calendarGridProps = vi.fn();

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: vi.fn(),
}));

import CalendarPage from "../calendar";
import { useMediaQuery } from "@/hooks/use-media-query";
const mediaQueryMock = vi.mocked(useMediaQuery);

vi.mock("@/components/CalendarGrid", () => ({
  __esModule: true,
  default: (props: {
    onDayClick?: (date: Date, transactions: ParsedTransaction[]) => void;
    transactions: ParsedTransaction[];
  }) => {
    calendarGridProps(props);
    const { onDayClick } = props;
    return (
      <button
        type="button"
        data-testid="button-open-day"
        onClick={() =>
          onDayClick?.(new Date("2024-05-18T12:00:00Z"), sampleTransactions)
        }
      >
        Open Day Detail
      </button>
    );
  },
}));

beforeEach(() => {
  calendarGridProps.mockClear();
  mediaQueryMock.mockReset();
  mediaQueryMock.mockReturnValue(true);
});

describe("CalendarPage day detail interactions", () => {
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

describe("CalendarPage filters", () => {
  it("filters to recurring transactions when recurring filter active", async () => {
    const user = userEvent.setup();

    const transactions: ParsedTransaction[] = [
      {
        id: "recurring-expense",
        date: new Date("2024-05-01T12:00:00Z"),
        description: "Streaming Service",
        amount: -12.99,
        category: "Expense",
        broker: "Streamer",
        source: { name: "Streamer", type: "merchant" },
        isRecurring: true,
      },
      {
        id: "one-off",
        date: new Date("2024-05-03T12:00:00Z"),
        description: "Groceries",
        amount: -45.5,
        category: "Expense",
        broker: "Grocer",
        source: { name: "Grocer", type: "merchant" },
        isRecurring: false,
      },
      {
        id: "recurring-income",
        date: new Date("2024-05-04T12:00:00Z"),
        description: "Salary",
        amount: 2200,
        category: "Income",
        broker: "Employer",
        source: { name: "Employer", type: "broker" },
        isRecurring: true,
      },
    ];

    render(<CalendarPage transactions={transactions} />);

    await waitFor(() => {
      expect(calendarGridProps).toHaveBeenCalled();
    });

    const allInitialLists = calendarGridProps.mock.calls.map(([props]) =>
      (props as { transactions?: ParsedTransaction[] }).transactions ?? []
    );
    expect(
      allInitialLists.some((list) => list.length === transactions.length)
    ).toBe(true);

    const recurringBadges = screen.getAllByTestId("badge-filter-recurring");
    const initialCallCount = calendarGridProps.mock.calls.length;
    await user.click(recurringBadges[0]);

    await waitFor(() => {
      expect(calendarGridProps.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    const recurringTransactions = transactions.filter((tx) => tx.isRecurring);
    const updatedLists = calendarGridProps.mock.calls
      .slice(initialCallCount)
      .map(([props]) =>
        (props as { transactions?: ParsedTransaction[] }).transactions ?? []
      );

    expect(
      updatedLists.some(
        (list) =>
          list.length === recurringTransactions.length &&
          list.every((tx) => tx.isRecurring)
      )
    ).toBe(true);
  });
});

describe("CalendarDayCell summary display", () => {
  const date = new Date("2024-05-18T12:00:00Z");

  const renderCell = (transactions: ParsedTransaction[], extraProps: Record<string, unknown> = {}) =>
    render(
      <TooltipProvider>
        <CalendarDayCell
          date={date}
          transactions={transactions}
          isCurrentMonth
          {...extraProps}
        />
      </TooltipProvider>
    );

  it("shows transaction count when transactions exist", () => {
    renderCell(sampleTransactions);

    expect(screen.getByTestId("text-transaction-count")).toHaveTextContent(
      String(sampleTransactions.length)
    );
  });

  it("shows net totals without rendering the detailed card", () => {
    const transactions: ParsedTransaction[] = [
      {
        id: "income-1",
        date,
        description: "Salary",
        amount: 5000,
        category: "Income",
        broker: "Employer",
        source: { name: "Employer", type: "broker" },
        isRecurring: false,
      },
      {
        id: "income-2",
        date,
        description: "Bonus",
        amount: 1500,
        category: "Income",
        broker: "Employer",
        source: { name: "Employer", type: "broker" },
        isRecurring: false,
      },
    ];

    renderCell(transactions);

    expect(screen.getByTestId("day-net-total")).toHaveTextContent("+$6,500.00");
    expect(screen.getByTestId("text-transaction-count")).toHaveTextContent("2");
    expect(screen.queryByTestId("group-card-income")).not.toBeInTheDocument();
  });

  it("keeps the layout compact for expense-heavy days", () => {
    const transactions: ParsedTransaction[] = [
      {
        id: "expense-1",
        date,
        description: "Rent",
        amount: -1800,
        category: "Expense",
        broker: "Landlord",
        source: { name: "Landlord", type: "merchant" },
        isRecurring: true,
      },
      {
        id: "expense-2",
        date,
        description: "Groceries",
        amount: -120.5,
        category: "Expense",
        broker: "Whole Foods",
        source: { name: "Whole Foods", type: "merchant" },
        isRecurring: false,
      },
    ];

    renderCell(transactions);

    expect(screen.getByTestId("day-net-total")).toHaveTextContent("-$1,920.50");
    expect(screen.getByTestId("text-transaction-count")).toHaveTextContent("2");
    expect(screen.queryByTestId("group-card-expenses")).not.toBeInTheDocument();
  });

  it("displays the currency symbol from the transaction data", () => {
    const transactions: ParsedTransaction[] = [
      {
        id: "income-eur",
        date,
        description: "Consulting",
        amount: 3200,
        category: "Income",
        broker: "EU Client",
        source: { name: "EU Client", type: "broker" },
        isRecurring: false,
        currencySymbol: "€",
      },
    ];

    renderCell(transactions);

    expect(screen.getByTestId("day-net-total")).toHaveTextContent("+€3,200.00");
  });

  it("shows a recurring badge when recurring transactions are present", () => {
    const transactions: ParsedTransaction[] = [
      {
        id: "recurring-1",
        date,
        description: "Subscription",
        amount: -25,
        category: "Expense",
        broker: "Service",
        source: { name: "Service", type: "merchant" },
        isRecurring: true,
      },
      {
        id: "recurring-2",
        date,
        description: "Salary",
        amount: 2500,
        category: "Income",
        broker: "Employer",
        source: { name: "Employer", type: "broker" },
        isRecurring: true,
      },
    ];

    renderCell(transactions);

    expect(screen.getByTestId("pill-recurring-count")).toHaveTextContent("2");
  });

  it("renders a placeholder when no transactions exist", () => {
    renderCell([]);

    expect(screen.getByTestId("empty-day-placeholder")).toBeInTheDocument();
    expect(screen.queryByTestId("text-transaction-count")).not.toBeInTheDocument();
  });

  it("displays a net total badge for the day", () => {
    const transactions: ParsedTransaction[] = [
      {
        id: "income-1",
        date,
        description: "Consulting",
        amount: 3200,
        category: "Income",
        broker: "Client",
        source: { name: "Client", type: "broker" },
        isRecurring: false,
      },
      {
        id: "expense-1",
        date,
        description: "Rent",
        amount: -1400,
        category: "Expense",
        broker: "Landlord",
        source: { name: "Landlord", type: "merchant" },
        isRecurring: false,
      },
    ];

    renderCell(transactions);

    expect(screen.getByTestId("day-net-total")).toHaveTextContent("$1,800.00");
  });
});

describe("CalendarDayCell interactions and styling", () => {
  it("calls onSelect handler when cell is clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <TooltipProvider>
        <CalendarDayCell
          date={new Date("2024-05-18T12:00:00Z")}
          transactions={sampleTransactions}
          isCurrentMonth
          onSelect={handleClick}
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
          onSelect={vi.fn()}
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
          onSelect={vi.fn()}
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
          onSelect={vi.fn()}
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
          onSelect={vi.fn()}
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
          onSelect={vi.fn()}
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
          onSelect={vi.fn()}
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
          onSelect={vi.fn()}
        />
      </TooltipProvider>
    );

    const dayNumber = screen.getByTestId("text-day-number");
    expect(dayNumber).not.toHaveClass("bg-primary");
    expect(dayNumber).toHaveClass("text-foreground");
  });
});
