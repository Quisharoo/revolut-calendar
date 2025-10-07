import type { ParsedTransaction } from "@shared/schema";
import {
  formatCurrency,
} from "@/lib/transactionUtils";

interface CalendarDayCellProps {
  date: Date;
  transactions: ParsedTransaction[];
  isCurrentMonth: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function CalendarDayCell({
  date,
  transactions,
  isCurrentMonth,
  isSelected = false,
  onClick,
}: CalendarDayCellProps) {
  const isToday = date.toDateString() === new Date().toDateString();

  const incomeTransactions = transactions.filter((t) => t.amount > 0);
  const expenseTransactions = transactions.filter((t) => t.amount < 0);

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div
      className={`flex h-full flex-col border border-border bg-card p-2 transition-colors hover-elevate cursor-pointer ${
        !isCurrentMonth ? "opacity-40" : ""
      } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
      onClick={onClick}
      data-testid={`cell-day-${date.getDate()}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            isToday
              ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
              : "text-foreground"
          }`}
          data-testid="text-day-number"
        >
          {date.getDate()}
        </span>
        {transactions.length > 0 && (
          <span className="text-[10px] text-muted-foreground" data-testid="text-transaction-count">
            {transactions.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="day-scroll flex h-full flex-col gap-1.5 overflow-y-auto pr-1">
          {totalIncome > 0 && (
            <div
              className="group rounded-md border border-border bg-background/70 p-2 shadow-sm transition-shadow duration-150 hover:shadow-md"
              data-testid="preview-income-summary"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <p className="text-[11px] font-medium leading-none text-foreground">
                  Income
                </p>
              </div>
              <p className="text-sm font-semibold leading-none text-primary">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          )}

          {totalExpense < 0 && (
            <div
              className="group rounded-md border border-border bg-background/70 p-2 shadow-sm transition-shadow duration-150 hover:shadow-md"
              data-testid="preview-expense-summary"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-destructive" />
                <p className="text-[11px] font-medium leading-none text-foreground">
                  Expenses
                </p>
              </div>
              <p className="text-sm font-semibold leading-none text-destructive">
                {formatCurrency(totalExpense)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
