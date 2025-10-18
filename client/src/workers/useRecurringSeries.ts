import { useEffect, useState } from "react";
import type { ParsedTransaction, RecurringSeries } from "@shared/schema";
import { detectRecurringSeriesAsync } from "./recurrenceClient";

interface RecurringSeriesState {
  series: RecurringSeries[];
  orphanIds: string[];
}

export const useRecurringSeries = (
  transactions: ParsedTransaction[]
): RecurringSeriesState => {
  const [state, setState] = useState<RecurringSeriesState>({
    series: [],
    orphanIds: [],
  });

  useEffect(() => {
    let cancelled = false;
    detectRecurringSeriesAsync(transactions).then((result) => {
      if (!cancelled) {
        setState({ series: result.series, orphanIds: result.orphanIds });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [transactions]);

  return state;
};
