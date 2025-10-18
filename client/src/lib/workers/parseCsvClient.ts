import { callWorker } from "./callWorker";

interface ParseCsvPayload {
  file: File;
}

interface ParseCsvResult {
  ok: boolean;
  transactions: import("@shared/schema").Transaction[];
  errors: string[];
}

let workerInstance: Worker | null = null;

const ensureWorker = () => {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL("../../workers/parseCsv.worker.ts", import.meta.url),
      { type: "module" }
    );
  }
  return workerInstance;
};

export const parseCsvInWorker = (file: File) =>
  callWorker<ParseCsvPayload, ParseCsvResult>(ensureWorker(), { file });
