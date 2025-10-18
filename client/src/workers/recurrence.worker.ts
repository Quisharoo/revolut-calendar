/// <reference lib="webworker" />

import { detectRecurringSeries } from "@/lib/recurrenceDetection";
import type { Transaction } from "@shared/schema";

interface WorkerRequest {
  id: number;
  type: "detect";
  payload: Transaction[];
}

interface WorkerResponse {
  id: number;
  result: ReturnType<typeof detectRecurringSeries>;
}

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;
  if (type === "detect") {
    const result = detectRecurringSeries(payload);
    const response: WorkerResponse = { id, result };
    self.postMessage(response);
  }
};

export {};
