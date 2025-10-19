import type {
  RecurrenceDetectionOptions,
  DetectRecurringResult,
} from "@/lib/recurrenceDetection";
import { callWorker } from "./callWorker";
import type { ParsedTransaction } from "@shared/schema";

interface DetectRecurringPayload {
  transactions: ParsedTransaction[];
  options?: Partial<RecurrenceDetectionOptions>;
}

let workerInstance: Worker | null = null;

const ensureWorker = () => {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL("../../workers/detectRecurring.worker.ts", import.meta.url),
      { type: "module" }
    );
  }
  return workerInstance;
};

export const detectRecurringInWorker = (
  transactions: ParsedTransaction[],
  options?: Partial<RecurrenceDetectionOptions>
) =>
  callWorker<DetectRecurringPayload, DetectRecurringResult>(ensureWorker(), {
    transactions,
    options,
  });
