import React from 'react';
import type { ParsedTransaction } from '@shared/schema';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  summarizeRecurringTransactionsForMonth,
  type RecurringSeriesSummary,
} from '@/lib/recurrenceDetection';
import { DEFAULT_CURRENCY_SYMBOL, formatCurrency } from '@/lib/transactionUtils';

const formatDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const formatMonth = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });

const buildOccurrenceSummary = (summary: RecurringSeriesSummary) => {
  const { occurrenceCount, firstOccurrence, lastOccurrence, representative } = summary;
  const spanLabel =
    firstOccurrence.getFullYear() === lastOccurrence.getFullYear() &&
    firstOccurrence.getMonth() === lastOccurrence.getMonth()
      ? formatMonth(firstOccurrence)
      : `${formatMonth(firstOccurrence)} – ${formatMonth(lastOccurrence)}`;

  return `${formatDate(representative.date)} • ${occurrenceCount} occurrence${
    occurrenceCount === 1 ? '' : 's'
  } (${spanLabel})`;
};

interface ExportModalProps {
  transactions: ParsedTransaction[];
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedIds: string[], monthDate: Date) => void;
  isGenerating?: boolean;
  monthDate?: Date;
}

export default function ExportModal({
  transactions,
  isOpen,
  onClose,
  onExport,
  isGenerating = false,
  monthDate,
}: ExportModalProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const resolvedMonthDate = React.useMemo(() => {
    if (monthDate instanceof Date && !Number.isNaN(monthDate.valueOf())) {
      return new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    }

    if (transactions.length === 0) {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const latest = transactions.reduce<Date | null>((latestDate, transaction) => {
      if (!(transaction.date instanceof Date)) {
        return latestDate;
      }

      if (!latestDate || transaction.date.getTime() > latestDate.getTime()) {
        return transaction.date;
      }

      return latestDate;
    }, null);

    const fallback = latest ?? new Date();
    return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  }, [monthDate, transactions]);

  const monthLabel = React.useMemo(
    () =>
      resolvedMonthDate.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [resolvedMonthDate]
  );

  const recurringSummaries = React.useMemo(
    () =>
      summarizeRecurringTransactionsForMonth(transactions, resolvedMonthDate),
    [transactions, resolvedMonthDate]
  );

  React.useEffect(() => {
    setSelected(
      new Set(recurringSummaries.map((summary) => summary.representative.id))
    );
  }, [recurringSummaries]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    if (selected.size === 0) {
      return;
    }
    onExport(Array.from(selected), resolvedMonthDate);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetTitle>Export Recurring Transactions</SheetTitle>
        <SheetDescription>
          Select recurring transactions detected for {monthLabel} to include in the
          calendar export.
        </SheetDescription>
        <div className="mt-4 max-h-60 overflow-auto">
          {recurringSummaries.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              No recurring transactions detected for this month.
            </p>
          ) : (
            recurringSummaries.map((summary) => {
              const { representative } = summary;
              const id = representative.id;
              const label = representative.source?.name ?? representative.description;
              const amountLabel = formatCurrency(
                representative.amount,
                representative.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL
              );

              return (
                <label
                  key={summary.groupId}
                  className="flex items-center gap-2 p-2 hover:bg-muted"
                >
                  <input
                    aria-label={`select-transaction-${id}`}
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => toggle(id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{label}</span>
                      <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                        {amountLabel}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {buildOccurrenceSummary(summary)}
                    </div>
                  </div>
                </label>
              );
            })
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleExport}
            disabled={
              isGenerating || selected.size === 0 || recurringSummaries.length === 0
            }
          >
            {isGenerating ? 'Generating...' : 'Export'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
