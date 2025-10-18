import { useState } from 'react';
import type { RecurringSeries } from '@shared/schema';
import { buildIcsInWorker } from '@/lib/workers';

export const useExport = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const exportTransactions = async (
    series: RecurringSeries[],
    selectedSeriesIds: string[],
    monthDate?: Date
  ) => {
    setIsGenerating(true);
    try {
      const buildResult = await buildIcsInWorker(series, {
        monthDate: monthDate ?? new Date(),
        selectedSeriesIds,
      });
      const blob = new Blob([buildResult.icsText], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const fileName = `recurring-transactions-${new Date().toISOString().replace(/[:.]/g,'-')}.ics`;
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
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
