import { ICS_MAX_LINE_LENGTH } from "./constants";

export const ensureDate = (value: string | number | Date): Date => {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  throw new TypeError("Unable to coerce value to Date");
};

export const normalizeWhitespace = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

export const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

export const foldIcsLine = (line: string): string => {
  if (line.length <= ICS_MAX_LINE_LENGTH) {
    return line;
  }

  const chunks: string[] = [];
  let index = 0;
  while (index < line.length) {
    const chunk = line.slice(index, index + ICS_MAX_LINE_LENGTH);
    chunks.push(index === 0 ? chunk : ` ${chunk}`);
    index += ICS_MAX_LINE_LENGTH;
  }
  return chunks.join("\r\n");
};

export const foldIcsLines = (lines: string[]): string[] =>
  lines.flatMap((line) => foldIcsLine(line).split(/\r?\n/));

export const sortByDateAscending = <T extends { date: Date }>(values: T[]): T[] =>
  [...values].sort((first, second) => first.date.getTime() - second.date.getTime());

export const clamp = (value: number, lower: number, upper: number): number => {
  if (Number.isNaN(value)) {
    return lower;
  }
  return Math.min(Math.max(value, lower), upper);
};

export const hashString = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};
