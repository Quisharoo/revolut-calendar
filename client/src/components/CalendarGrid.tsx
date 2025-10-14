import type { ParsedTransaction } from "@shared/schema";
import CalendarDayCell from "./CalendarDayCell";
import {
  getMonthDays,
  summarizeTransactionsByDate,
  getLocalDateKey,
  type DailySummary,
  DEFAULT_CURRENCY_SYMBOL,
} from "@/lib/transactionUtils";

interface CalendarGridProps {
  currentDate: Date;
  transactions: ParsedTransaction[];
  selectedDate?: Date | null;
  onDayClick?: (date: Date, transactions: ParsedTransaction[]) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarGrid({
  currentDate,
  transactions,
  selectedDate,
  onDayClick,
}: CalendarGridProps) {
  const monthDays = getMonthDays(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );
  const summariesByDate = summarizeTransactionsByDate(transactions);

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
      <div className="grid grid-cols-7 auto-rows-[minmax(180px,auto)]">
        {monthDays.map((date, index) => {
          const dateKey = getLocalDateKey(date);
          const summary: DailySummary = summariesByDate.get(dateKey) || {
            dateKey,
            date,
            totals: { income: 0, expense: 0, net: 0 },
            recurringCount: 0,
            transactions: [],
            groups: [],
            currencySymbol: DEFAULT_CURRENCY_SYMBOL,
          };
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isSelected = selectedDate?.toDateString() === date.toDateString();

          return (
            <CalendarDayCell
              key={index}
              date={date}
              summary={summary}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected}
              onSelect={(selectedDate, selectedSummary) =>
                onDayClick?.(selectedDate, selectedSummary.transactions)
              }
            />
          );
        })}
      </div>
    </div>
  );
}
