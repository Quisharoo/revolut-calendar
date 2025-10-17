import { useState } from 'react';
import { buildRecurringIcs } from '@/lib/icsExport';

export const useExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportTransactions = async (transactions: any[], selectedIds: string[], monthDate?: Date) => {
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
      document.body.removeChild(a);
      // revokeObjectURL may not exist in some JS DOM/test environments; guard the call
      setTimeout(() => {
        try {
          if (typeof URL.revokeObjectURL === 'function') {
            URL.revokeObjectURL(url);
          }
        } catch (e) {
          // swallow errors during cleanup in environments that don't fully implement URL
          // this keeps tests from failing due to environment limitations
          // eslint-disable-next-line no-console
          console.debug('revokeObjectURL unavailable or failed', e);
        }
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
