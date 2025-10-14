import { useCallback, useEffect, useMemo, useState } from "react";
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
  selectedRange?: { start: Date; end: Date } | null;
  onRangeSelect?: (range: { start: Date; end: Date }) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DragState = {
  startIndex: number;
  endIndex: number;
  pointerId: number;
  hasMoved: boolean;
};

const orderIndices = (a: number, b: number) =>
  a <= b
    ? { startIndex: a, endIndex: b }
    : { startIndex: b, endIndex: a };

export default function CalendarGrid({
  currentDate,
  transactions,
  selectedDate,
  onDayClick,
  selectedRange,
  onRangeSelect,
}: CalendarGridProps) {
  const monthDays = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate]
  );
  const summariesByDate = summarizeTransactionsByDate(transactions);

  const [dragState, setDragState] = useState<DragState | null>(null);

  const finalizeSelection = useCallback(
    (pointerId: number, finalIndex?: number) => {
      let range: { start: Date; end: Date } | null = null;
      setDragState((state) => {
        if (!state || state.pointerId !== pointerId) {
          return state;
        }

        const resolvedEndIndex = finalIndex ?? state.endIndex;
        const hasDragged = state.hasMoved || resolvedEndIndex !== state.startIndex;

        if (hasDragged) {
          const ordered = orderIndices(state.startIndex, resolvedEndIndex);
          range = {
            start: monthDays[ordered.startIndex],
            end: monthDays[ordered.endIndex],
          };
        }

        return null;
      });

      if (range) {
        onRangeSelect?.(range);
      }
    },
    [monthDays, onRangeSelect]
  );

  useEffect(() => {
    if (!dragState) {
      return;
    }

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId === dragState.pointerId) {
        finalizeSelection(event.pointerId);
      }
    };

    window.addEventListener("pointerup", handlePointerCancel);
    window.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      window.removeEventListener("pointerup", handlePointerCancel);
      window.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [dragState, finalizeSelection]);

  const selectedRangeIndices = useMemo(() => {
    if (!selectedRange) {
      return null;
    }

    const startIndex = monthDays.findIndex(
      (date) => date.toDateString() === selectedRange.start.toDateString()
    );
    const endIndex = monthDays.findIndex(
      (date) => date.toDateString() === selectedRange.end.toDateString()
    );

    if (startIndex === -1 || endIndex === -1) {
      return null;
    }

    return orderIndices(startIndex, endIndex);
  }, [monthDays, selectedRange]);

  const previewRange = dragState
    ? orderIndices(dragState.startIndex, dragState.endIndex)
    : null;

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
          const isPreview = Boolean(
            previewRange &&
              index >= previewRange.startIndex &&
              index <= previewRange.endIndex
          );
          const isConfirmedRange =
            !dragState &&
            Boolean(
              selectedRangeIndices &&
                index >= selectedRangeIndices.startIndex &&
                index <= selectedRangeIndices.endIndex
            );
          const isInRange = isPreview || isConfirmedRange;
          const isRangeEdge = Boolean(
            (previewRange &&
              (index === previewRange.startIndex ||
                index === previewRange.endIndex)) ||
              (!dragState &&
                selectedRangeIndices &&
                (index === selectedRangeIndices.startIndex ||
                  index === selectedRangeIndices.endIndex))
          );

          return (
            <CalendarDayCell
              key={index}
              date={date}
              summary={summary}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected}
              isInRange={isInRange}
              isRangeEdge={isRangeEdge}
              isPreview={isPreview}
              disableClick={dragState?.hasMoved ?? false}
              onSelect={(selectedDate, selectedSummary) =>
                onDayClick?.(selectedDate, selectedSummary.transactions)
              }
              onPointerDown={(event) => {
                const isMouse = event.pointerType === "mouse";
                const isTouch = event.pointerType === "touch";
                const isPen = event.pointerType === "pen";
                if (isMouse && event.button !== 0) {
                  return;
                }
                if (!isMouse && !isTouch && !isPen) {
                  return;
                }
                if (isMouse) {
                  event.preventDefault();
                  event.stopPropagation();
                }
                setDragState({
                  startIndex: index,
                  endIndex: index,
                  pointerId: event.pointerId,
                  hasMoved: false,
                });
              }}
              onPointerEnter={(event) => {
                setDragState((state) => {
                  if (!state || state.pointerId !== event.pointerId) {
                    return state;
                  }
                  if (state.endIndex === index) {
                    return state;
                  }
                  const hasMoved = state.hasMoved || index !== state.startIndex;
                  return { ...state, endIndex: index, hasMoved };
                });
              }}
              onPointerUp={(event) => {
                if (!dragState || dragState.pointerId !== event.pointerId) {
                  return;
                }
                if (event.pointerType === "mouse") {
                  event.preventDefault();
                }
                finalizeSelection(event.pointerId, index);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
