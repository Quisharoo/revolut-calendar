import React from 'react';
import type { ParsedTransaction } from '@shared/schema';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface ExportModalProps {
  transactions: ParsedTransaction[];
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedIds: string[]) => void;
  isGenerating?: boolean;
}

export default function ExportModal({
  transactions,
  isOpen,
  onClose,
  onExport,
  isGenerating = false,
}: ExportModalProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setSelected(new Set(transactions.filter((t) => t.isRecurring).map((t) => t.id)));
  }, [transactions]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    onExport(Array.from(selected));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <SheetContent>
        <SheetTitle>Export Recurring Transactions</SheetTitle>
        <SheetDescription>Select recurring transactions to include in the calendar export.</SheetDescription>
        <div className="mt-4 max-h-60 overflow-auto">
          {transactions.filter((t) => t.isRecurring).map((tx) => (
            <label key={tx.id} className="flex items-center gap-2 p-2 hover:bg-muted">
              <input
                aria-label={`select-transaction-${tx.id}`}
                type="checkbox"
                checked={selected.has(tx.id)}
                onChange={() => toggle(tx.id)}
              />
              <div className="flex-1">
                <div className="font-medium">{tx.description}</div>
                <div className="text-sm text-muted-foreground">{tx.date instanceof Date ? tx.date.toDateString() : String(tx.date)}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport} disabled={isGenerating || selected.size === 0}>
            {isGenerating ? 'Generating...' : 'Export'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
