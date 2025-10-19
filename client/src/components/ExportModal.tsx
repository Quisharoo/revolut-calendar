import React from "react";
import type { RecurringSeries } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DEFAULT_CURRENCY_SYMBOL, formatCurrency } from "@/lib/transactionUtils";
import { selectSeriesForMonth } from "@/lib/recurrenceDetection";

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatMonthRange = (series: RecurringSeries) => {
  const first = series.transactions[0];
  const last = series.transactions[series.transactions.length - 1];
  return `${formatDate(first.date)} – ${formatDate(last.date)}`;
};

interface ExportModalProps {
  series: RecurringSeries[];
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedSeriesIds: string[], monthDate: Date) => void;
  isGenerating?: boolean;
  monthDate?: Date;
}

const toMonthStart = (input?: Date) => {
  if (input instanceof Date && !Number.isNaN(input.valueOf())) {
    return new Date(input.getFullYear(), input.getMonth(), 1);
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

export default function ExportModal({
  series,
  isOpen,
  onClose,
  onExport,
  isGenerating = false,
  monthDate,
}: ExportModalProps) {
  const resolvedMonthDate = React.useMemo(() => toMonthStart(monthDate), [monthDate]);

  const monthLabel = React.useMemo(
    () =>
      resolvedMonthDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [resolvedMonthDate]
  );

  const seriesForMonth = React.useMemo(
    () => selectSeriesForMonth(series, resolvedMonthDate),
    [series, resolvedMonthDate]
  );

  const [selected, setSelected] = React.useState<Set<string>>(
    new Set(seriesForMonth.map((entry) => entry.id))
  );

  React.useEffect(() => {
    setSelected(new Set(seriesForMonth.map((entry) => entry.id)));
  }, [seriesForMonth]);

  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    setSelected((previous) => {
      if (seriesForMonth.every((entry) => previous.has(entry.id))) {
        return new Set();
      }
      return new Set(seriesForMonth.map((entry) => entry.id));
    });
  };

  const handleExport = () => {
    if (selected.size === 0) {
      return;
    }
    onExport(Array.from(selected), resolvedMonthDate);
  };

  const allSelected =
    seriesForMonth.length > 0 &&
    seriesForMonth.every((entry) => selected.has(entry.id));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Recurring Transactions</DialogTitle>
          <DialogDescription>
            Select recurring transaction series detected for all data. One event will be
            generated per series for {monthLabel}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Exporting for {monthLabel}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAll}
            disabled={seriesForMonth.length === 0}
          >
            {allSelected ? "Unselect all" : "Select all"}
          </Button>
        </div>
        <div className="min-h-[120px] flex-1 overflow-auto rounded-md border border-border/40 pr-1">
          {seriesForMonth.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              No recurring transactions detected for this month.
            </p>
          ) : (
            <div className="divide-y">
              {seriesForMonth.map((entry) => {
                const representative = entry.representative;
                const amountLabel = formatCurrency(
                  representative.amount,
                  representative.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL
                );
                return (
                  <label
                    key={entry.id}
                    className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted"
                  >
                    <input
                      aria-label={`select-series-${entry.id}`}
                      type="checkbox"
                      checked={selected.has(entry.id)}
                      onChange={() => toggle(entry.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">
                          {representative.source?.name ?? representative.description}
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                          {amountLabel}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatMonthRange(entry)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isGenerating || selected.size === 0}>
            {isGenerating ? "Generating…" : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
