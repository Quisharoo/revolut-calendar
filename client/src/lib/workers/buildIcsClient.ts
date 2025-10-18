import type { RecurringSeries } from "@shared/schema";
import { callWorker } from "./callWorker";
import { buildRecurringIcs, type BuildRecurringIcsResult } from "@/lib/icsExport";

interface BuildIcsPayload {
  series: RecurringSeries[];
  monthDate: string;
  calendarName?: string;
  timezone?: string;
  selectedSeriesIds?: string[];
}

let workerInstance: Worker | null = null;

const isWorkerSupported = typeof Worker !== "undefined";

const ensureWorker = () => {
  if (!isWorkerSupported) {
    throw new Error("Web Workers are not supported in this environment");
  }
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL("../../workers/buildIcs.worker.ts", import.meta.url),
      { type: "module" }
    );
  }
  return workerInstance;
};

export const buildIcsInWorker = (
  series: RecurringSeries[],
  options: {
    monthDate: Date;
    calendarName?: string;
    timezone?: string;
    selectedSeriesIds?: string[];
  }
) => {
  if (!isWorkerSupported) {
    return Promise.resolve(
      buildRecurringIcs(series, {
        monthDate: options.monthDate,
        calendarName: options.calendarName,
        timezone: options.timezone,
        selectedSeriesIds: options.selectedSeriesIds,
      })
    );
  }

  return callWorker<BuildIcsPayload, BuildRecurringIcsResult>(ensureWorker(), {
    series,
    monthDate: options.monthDate.toISOString(),
    calendarName: options.calendarName,
    timezone: options.timezone,
    selectedSeriesIds: options.selectedSeriesIds,
  });
};
