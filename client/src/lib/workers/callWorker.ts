const nextMessageId = (() => {
  let counter = 0;
  return () => {
    counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
    const base = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `${base}:${counter}`;
  };
})();

interface WorkerRpcEnvelope<TPayload> {
  id: string;
  payload: TPayload;
}

interface WorkerRpcSuccess<TResult> {
  id: string;
  ok: true;
  result: TResult;
}

interface WorkerRpcError {
  id: string;
  ok: false;
  error: string;
}

export type WorkerRpcResponse<TResult> = WorkerRpcSuccess<TResult> | WorkerRpcError;

export const callWorker = <TPayload, TResult>(
  worker: Worker,
  payload: TPayload
): Promise<TResult> =>
  new Promise<TResult>((resolve, reject) => {
    const id = nextMessageId();

    const handleMessage = (event: MessageEvent<WorkerRpcResponse<TResult>>) => {
      if (!event.data || event.data.id !== id) {
        return;
      }

      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);

      if (event.data.ok) {
        resolve(event.data.result);
        return;
      }

      reject(new Error(event.data.error));
    };

    const handleError = (error: ErrorEvent) => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      reject(error.error ?? new Error(error.message));
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    const envelope: WorkerRpcEnvelope<TPayload> = { id, payload };
    worker.postMessage(envelope);
  });
