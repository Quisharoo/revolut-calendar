import { useState } from 'react';
import { buildRecurringIcs } from '@/lib/icsExport';
import type { ParsedTransaction } from '@/types/transactions';

export const useExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportTransactions = async (transactions: ParsedTransaction[], selectedIds: string[], monthDate?: Date) => {
    setIsGenerating(true);
    try {
      const selected = transactions.filter((t) => selectedIds.includes(t.id));
      const ics = buildRecurringIcs(selected, { monthDate: monthDate ?? new Date() });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const fileName = `recurring-transactions-${new Date().toISOString().replace(/[:.]/g,'-')}.ics`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      // The object URL will be automatically revoked when the document is unloaded.
      // Explicitly revoking it with a timeout is unreliable and can cancel the download.
      // URL.revokeObjectURL(url);
      }, 0);
      return { success: true, fileName };
    } catch (error) {
      console.error('Export failed', error);
      return { success: false, error: (error as Error).message };
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, exportTransactions };
};
