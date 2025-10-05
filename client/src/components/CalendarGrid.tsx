import type { ParsedTransaction } from "@shared/schema";
import CalendarDayCell from "./CalendarDayCell";
import { getMonthDays, groupTransactionsByDate } from "@/lib/transactionUtils";

interface CalendarGridProps {
  currentDate: Date;
  transactions: ParsedTransaction[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({
  currentDate,
  transactions,
}: CalendarGridProps) {
  const monthDays = getMonthDays(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );
  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div className="bg-card rounded-lg border border-card-border overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/30"
            data-testid={`header-weekday-${day}`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthDays.map((date, index) => {
          const dateKey = date.toISOString().split("T")[0];
          const dayTransactions = groupedTransactions.get(dateKey) || [];
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();

          return (
            <CalendarDayCell
              key={index}
              date={date}
              transactions={dayTransactions}
              isCurrentMonth={isCurrentMonth}
            />
          );
        })}
      </div>
    </div>
  );
}
