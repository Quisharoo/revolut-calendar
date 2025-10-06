import type { ParsedTransaction } from "@shared/schema";
import { formatCurrency } from "@/lib/transactionUtils";

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

  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const hasIncome = totalIncome > 0;
  const hasExpense = totalExpense > 0;

  return (
    <div
      className={`min-h-[120px] p-2 border border-border bg-card cursor-pointer transition-colors hover-elevate ${
        !isCurrentMonth ? "opacity-40" : ""
      } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
      onClick={onClick}
      data-testid={`cell-day-${date.getDate()}`}
    >
      <div className="flex items-center justify-between mb-2">
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

      <div className="space-y-1.5">
        {hasIncome && (
          <div
            className="p-2 rounded-md bg-primary/10 border border-primary/20"
            data-testid="card-income-summary"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-primary">Income</span>
              <span className="text-xs font-semibold text-primary" data-testid="text-income-total">
                {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>
        )}

        {hasExpense && (
          <div
            className="p-2 rounded-md bg-destructive/10 border border-destructive/20"
            data-testid="card-expense-summary"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium text-destructive">Expense</span>
              <span className="text-xs font-semibold text-destructive" data-testid="text-expense-total">
                -{formatCurrency(totalExpense)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
