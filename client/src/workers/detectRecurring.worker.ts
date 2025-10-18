/// <reference lib="webworker" />

import type { DetectRecurringResult, RecurrenceDetectionOptions } from "@/lib/recurrenceDetection";
import { detectRecurringSeries } from "@/lib/recurrenceDetection";
import type { ParsedTransaction } from "@shared/schema";

interface DetectRecurringPayload {
  transactions: ParsedTransaction[];
  options?: Partial<RecurrenceDetectionOptions>;
}

interface WorkerEnvelope<TPayload> {
  id: string;
  payload: TPayload;
}

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener(
  "message",
  (event: MessageEvent<WorkerEnvelope<DetectRecurringPayload>>) => {
  const { id, payload } = event.data;
  try {
    const result: DetectRecurringResult = detectRecurringSeries(
      payload.transactions,
      payload.options
    );
    ctx.postMessage({ id, ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recurring detection failed";
    ctx.postMessage({ id, ok: false, error: message });
  }
});

export {};
