import { useMemo } from "react";
import type { ParsedTransaction } from "@shared/schema";
import {
  formatCurrency,
  summarizeTransactionsByDate,
  type DailySummary,
  type DailyTransactionGroup,
} from "@/lib/transactionUtils";
import { RepeatIcon } from "lucide-react";

interface CalendarDayCellProps {
  date: Date;
  summary?: DailySummary;
  transactions?: ParsedTransaction[];
  isCurrentMonth: boolean;
  isSelected?: boolean;
  onSelect?: (date: Date, summary: DailySummary) => void;
}

const netColorClass = (value: number) => {
  if (value > 0) return "text-primary";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
};

const AggregateCard = ({ group }: { group: DailyTransactionGroup }) => {
  const { source, totals, transactions } = group;
  const isIncome = source.name === "Income";
  const slug = source.name.toLowerCase();

  return (
    <div
      className={`rounded-md border ${
        isIncome ? "border-primary/20 bg-primary/5" : "border-destructive/20 bg-destructive/5"
      } p-2.5 shadow-sm`}
      data-testid={`group-card-${slug}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isIncome ? "bg-primary" : "bg-destructive"}`} />
          <p className={`text-xs font-semibold ${isIncome ? "text-primary" : "text-destructive"}`}>
            {source.name}
          </p>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              isIncome ? "bg-primary/10 text-primary/80" : "bg-destructive/10 text-destructive/80"
            }`}
            data-testid={`${slug}-transaction-count`}
          >
            {transactions.length}
          </span>
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${isIncome ? "text-primary" : "text-destructive"}`}
          data-testid={`group-net-${slug}`}
        >
          {formatCurrency(totals.net)}
        </span>
      </div>
    </div>
  );
};

export default function CalendarDayCell({
  date,
  summary,
  transactions,
  isCurrentMonth,
  isSelected = false,
  onSelect,
}: CalendarDayCellProps) {
  const resolvedSummary = useMemo<DailySummary>(() => {
    if (summary) {
      return summary;
    }

    const fallbackKey = date.toISOString().split("T")[0];
    const baseTransactions = transactions ?? [];
    if (baseTransactions.length === 0) {
      return {
        dateKey: fallbackKey,
        date,
        totals: { income: 0, expense: 0, transfer: 0, net: 0 },
        recurringCount: 0,
        transactions: [],
        groups: [],
      };
    }

    const summaries = summarizeTransactionsByDate(baseTransactions);
    const computed = summaries.get(fallbackKey);
    if (computed) {
      return computed;
    }

    const recurringCount = baseTransactions.filter((t) => t.isRecurring).length;

    return {
      dateKey: fallbackKey,
      date,
      totals: { income: 0, expense: 0, transfer: 0, net: 0 },
      recurringCount,
      transactions: baseTransactions,
      groups: [],
    };
  }, [summary, transactions, date]);

  const isToday = date.toDateString() === new Date().toDateString();
  const transactionCount = resolvedSummary.transactions.length;
  const netClass = netColorClass(resolvedSummary.totals.net);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex h-full flex-col border border-border bg-card p-2 transition-colors hover-elevate cursor-pointer ${
        !isCurrentMonth ? "opacity-40" : ""
      } ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
      onClick={() => onSelect?.(date, resolvedSummary)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(date, resolvedSummary);
        }
      }}
      data-testid={`cell-day-${date.getDate()}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
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
          {resolvedSummary.recurringCount > 0 && (
            <span
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
              data-testid="pill-recurring-count"
            >
              <RepeatIcon className="h-3 w-3" />
              {resolvedSummary.recurringCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {transactionCount > 0 && (
            <span
              className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              data-testid="text-transaction-count"
            >
              {transactionCount}
            </span>
          )}
          {resolvedSummary.totals.net !== 0 && (
            <span
              className={`text-[11px] font-semibold ${netClass}`}
              data-testid="day-net-total"
            >
              {formatCurrency(resolvedSummary.totals.net)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="day-scroll flex h-full flex-col gap-1.5 overflow-y-auto pr-1">
          {resolvedSummary.groups.map((group, index) => (
            <AggregateCard
              key={`${resolvedSummary.dateKey}-${group.source.name}-${index}`}
              group={group}
            />
          ))}
          {resolvedSummary.groups.length === 0 && (
            <div
              className="flex h-full items-center justify-center rounded-md border border-dashed border-border/60 text-[11px] text-muted-foreground"
              data-testid="empty-day-placeholder"
            >
              No transactions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
