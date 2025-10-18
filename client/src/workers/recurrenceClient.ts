import { detectRecurringSeries } from "@/lib/recurrenceDetection";
import type { Transaction } from "@shared/schema";

let workerInstance: Worker | null = null;
let requestId = 0;
const pending = new Map<number, (value: ReturnType<typeof detectRecurringSeries>) => void>();

const getWorker = () => {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }
  if (!workerInstance) {
    workerInstance = new Worker(new URL("./recurrence.worker.ts", import.meta.url), {
      type: "module",
    });
    workerInstance.onmessage = (
      event: MessageEvent<{ id: number; result: ReturnType<typeof detectRecurringSeries> }>
    ) => {
      const { id, result } = event.data;
      const resolver = pending.get(id);
      if (resolver) {
        resolver(result);
        pending.delete(id);
      }
    };
  }
  return workerInstance;
};

export const detectRecurringSeriesAsync = (transactions: Transaction[]) => {
  const worker = getWorker();
  if (!worker) {
    return Promise.resolve(detectRecurringSeries(transactions));
  }
  const id = ++requestId;
  return new Promise<ReturnType<typeof detectRecurringSeries>>((resolve) => {
    pending.set(id, resolve);
    worker.postMessage({ id, type: "detect", payload: transactions });
  });
};
