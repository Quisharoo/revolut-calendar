/// <reference lib="webworker" />

import type { Transaction } from "@shared/schema";
import { parseRevolutCsv } from "@/lib/revolutParser";

interface ParseCsvPayload {
  file: File;
}

interface ParseCsvResult {
  ok: boolean;
  transactions: Transaction[];
  errors: string[];
}

interface WorkerEnvelope<TPayload> {
  id: string;
  payload: TPayload;
}

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.addEventListener("message", async (event: MessageEvent<WorkerEnvelope<ParseCsvPayload>>) => {
  const { id, payload } = event.data;
  try {
    const text = await payload.file.text();
    const transactions = parseRevolutCsv(text);
    const result: ParseCsvResult = {
      ok: true,
      transactions,
      errors: [],
    };
    ctx.postMessage({ id, ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse CSV";
    const result: ParseCsvResult = {
      ok: false,
      transactions: [],
      errors: [message],
    };
    ctx.postMessage({ id, ok: true, result });
  }
});

export {};
