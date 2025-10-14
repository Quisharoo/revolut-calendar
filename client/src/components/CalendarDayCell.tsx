import { useMemo, type PointerEvent as ReactPointerEvent } from "react";
import type { ParsedTransaction } from "@shared/schema";
import {
  formatCurrency,
  summarizeTransactionsByDate,
  getLocalDateKey,
  type DailySummary,
  DEFAULT_CURRENCY_SYMBOL,
} from "@/lib/transactionUtils";
import { RepeatIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarDayCellProps {
  date: Date;
  summary?: DailySummary;
  transactions?: ParsedTransaction[];
  isCurrentMonth: boolean;
  isSelected?: boolean;
  onSelect?: (date: Date, summary: DailySummary) => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerEnter?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  disableClick?: boolean;
  isInRange?: boolean;
  isRangeEdge?: boolean;
  isPreview?: boolean;
}

const netColorClass = (value: number) => {
  if (value > 0) return "text-primary";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
};

/**
 * CalendarDayCell renders a compact day summary and forwards full detail to the sidebar view.
 */
export default function CalendarDayCell({
  date,
  summary,
  transactions,
  isCurrentMonth,
  isSelected = false,
  onSelect,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  disableClick = false,
  isInRange = false,
  isRangeEdge = false,
  isPreview = false,
}: CalendarDayCellProps) {
  const resolvedSummary = useMemo<DailySummary>(() => {
    if (summary) {
      return summary;
    }

    const fallbackKey = getLocalDateKey(date);
    const baseTransactions = transactions ?? [];
    if (baseTransactions.length === 0) {
      return {
        dateKey: fallbackKey,
        date,
        totals: { income: 0, expense: 0, net: 0 },
        recurringCount: 0,
        transactions: [],
        groups: [],
        currencySymbol: DEFAULT_CURRENCY_SYMBOL,
      };
    }

    const summaries = summarizeTransactionsByDate(baseTransactions);
    const computed = summaries.get(fallbackKey);
    if (computed) {
      return computed;
    }

    const recurringCount = baseTransactions.filter((t) => t.isRecurring).length;
    const currencySymbol = baseTransactions[0]?.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;

    return {
      dateKey: fallbackKey,
      date,
      totals: { income: 0, expense: 0, net: 0 },
      recurringCount,
      transactions: baseTransactions,
      groups: [],
      currencySymbol,
    };
  }, [summary, transactions, date]);

  const isToday = date.toDateString() === new Date().toDateString();
  const isFutureDate = useMemo(() => {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    const normalizedToday = new Date();
    normalizedToday.setHours(0, 0, 0, 0);
    return normalizedDate.getTime() > normalizedToday.getTime();
  }, [date]);
  const transactionCount = resolvedSummary.transactions.length;
  const netClass = netColorClass(resolvedSummary.totals.net);
  const incomeCount = resolvedSummary.transactions.filter((t) => t.amount > 0).length;
  const expenseCount = resolvedSummary.transactions.filter((t) => t.amount < 0).length;
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex h-full select-none flex-col border border-border bg-card transition-colors hover-elevate cursor-pointer",
        !isCurrentMonth && "opacity-40",
        isSelected && "ring-2 ring-primary ring-inset",
        isInRange && "bg-primary/10",
        isPreview && !isInRange && "bg-primary/5",
        isRangeEdge && "ring-2 ring-primary ring-inset"
      )}
      onClick={() => {
        if (!disableClick) {
          onSelect?.(date, resolvedSummary);
        }
      }}
      onPointerDown={(event) => {
        const isMouse = event.pointerType === "mouse";
        const isTouch = event.pointerType === "touch";
        if ((isMouse && event.button !== 0) || (!isMouse && !isTouch)) {
          return;
        }
        onPointerDown?.(event);
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
      }}
      onPointerUp={(event) => {
        const isMouse = event.pointerType === "mouse";
        const isTouch = event.pointerType === "touch";
        if ((isMouse && event.button !== 0) || (!isMouse && !isTouch)) {
          return;
        }
        onPointerUp?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(date, resolvedSummary);
        }
      }}
      data-testid={`cell-day-${date.getDate()}`}
    >
      <div className="flex items-start justify-between gap-2 p-3 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
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
        {transactionCount > 0 && (
          <span
            className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            data-testid="text-transaction-count"
          >
            {transactionCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3">
        {transactionCount > 0 ? (
          <>
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex w-full items-baseline justify-between gap-2">
                <span
                  className={`text-base font-bold tabular-nums tracking-tight leading-none whitespace-nowrap overflow-hidden text-ellipsis ${netClass}`}
                  data-testid="day-net-total"
                >
                  {formatCurrency(resolvedSummary.totals.net, resolvedSummary.currencySymbol)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-primary">{incomeCount}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5">
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-xs font-medium text-destructive">{expenseCount}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            className="mt-6 flex flex-1 items-center justify-center rounded-md border border-dashed border-border/60 px-3 py-4 text-[11px] text-muted-foreground"
            data-testid="empty-day-placeholder"
          >
            {!isFutureDate && "No transactions"}
          </div>
        )}
      </div>
    </div>
  );
}
