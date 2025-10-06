import type { ParsedTransaction } from "@shared/schema";
import TransactionCard from "./TransactionCard";

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
  const isToday =
    date.toDateString() === new Date().toDateString();

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
        {transactions.slice(0, 3).map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
        {transactions.length > 3 && (
          <p className="text-[10px] text-muted-foreground text-center py-1" data-testid="text-more-count">
            +{transactions.length - 3} more
          </p>
        )}
      </div>
    </div>
  );
}
