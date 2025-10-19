/// <reference lib="webworker" />

import type { RecurringSeries } from "@shared/schema";
import { buildRecurringIcs, type BuildRecurringIcsResult } from "@/lib/icsExport";

interface BuildIcsPayload {
  series: RecurringSeries[];
  monthDate: string;
  calendarName?: string;
  timezone?: string;
  selectedSeriesIds?: string[];
}

interface WorkerEnvelope<TPayload> {
  id: string;
  payload: TPayload;
}

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener(
  "message",
  (event: MessageEvent<WorkerEnvelope<BuildIcsPayload>>) => {
    const { id, payload } = event.data;
    try {
      const result: BuildRecurringIcsResult = buildRecurringIcs(payload.series, {
        monthDate: new Date(payload.monthDate),
        calendarName: payload.calendarName,
        timezone: payload.timezone,
        selectedSeriesIds: payload.selectedSeriesIds,
      });
      ctx.postMessage({ id, ok: true, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "ICS export failed";
      ctx.postMessage({ id, ok: false, error: message });
    }
  }
);

export {};
