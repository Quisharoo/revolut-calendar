import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(durationMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

export async function ensureMinimumDuration<T>(
  promise: Promise<T>,
  minimumDurationMs: number
): Promise<T> {
  const start = Date.now();

  try {
    return await promise;
  } finally {
    const elapsed = Date.now() - start;
    if (elapsed < minimumDurationMs) {
      await sleep(minimumDurationMs - elapsed);
    }
  }
}
