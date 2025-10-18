import React from 'react';
import type { ParsedTransaction } from '@shared/schema';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  detectRecurringTransactions,
  getGroupingKey,
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

const buildOccurrenceSummary = (occurrences: ParsedTransaction[]) => {
  if (!occurrences.length) return '';
  const first = occurrences[0];
  const last = occurrences[occurrences.length - 1];
  return `${formatDate(first.date)} • ${occurrences.length} occurrence${occurrences.length === 1 ? '' : 's'} (${formatMonth(first.date)} – ${formatMonth(last.date)})`;
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

  // Detect recurring transactions from all data
  const recurringIds = React.useMemo(() => detectRecurringTransactions(transactions), [transactions]);
  // Group recurring transactions by recurrence group
  const recurringGroups = React.useMemo(() => {
    const groups = new Map<string, ParsedTransaction[]>();
    transactions.forEach((tx) => {
      if (!recurringIds.has(tx.id)) return;
      const key = getGroupingKey(tx);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    });
    // Sort each group by date
    groups.forEach((arr) => arr.sort((a, b) => a.date.getTime() - b.date.getTime()));
    return Array.from(groups.entries());
  }, [transactions, recurringIds]);

  const representativeIds = React.useMemo(
    () => recurringGroups.map(([, arr]) => arr[arr.length - 1].id),
    [recurringGroups]
  );

  React.useEffect(() => {
    setSelected(new Set(representativeIds));
  }, [representativeIds]);

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

  const allSelected = representativeIds.length > 0 && representativeIds.every((id) => selected.has(id));

  const handleToggleAll = () => {
    if (representativeIds.length === 0) {
      setSelected(new Set());
      return;
    }

    setSelected((prev) => {
      if (representativeIds.every((id) => prev.has(id))) {
        return new Set();
      }

      return new Set(representativeIds);
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <SheetContent className="flex h-full flex-col overflow-hidden">
        <SheetTitle>Export Recurring Transactions</SheetTitle>
        <SheetDescription>
          Select recurring transactions detected from all data to include in the calendar export.
        </SheetDescription>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">Exporting for {monthLabel}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAll}
            disabled={representativeIds.length === 0}
          >
            {allSelected ? 'Unselect all' : 'Select all'}
          </Button>
        </div>
        <div className="mt-2 min-h-0 flex-1 overflow-auto pr-1">
          {recurringGroups.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              No recurring transactions detected.
            </p>
          ) : (
            recurringGroups.map(([groupId, occurrences]) => {
              const representative = occurrences[occurrences.length - 1];
              const id = representative.id;
              const label = representative.source?.name ?? representative.description;
              const amountLabel = formatCurrency(
                representative.amount,
                representative.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL
              );
              return (
                <label
                  key={groupId}
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
                      {buildOccurrenceSummary(occurrences)}
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
            disabled={isGenerating || selected.size === 0 || recurringGroups.length === 0}
          >
            {isGenerating ? 'Generating...' : 'Export'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
