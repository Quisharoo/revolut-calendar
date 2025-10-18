import { ICS_LINE_LENGTH_LIMIT } from "./constants";

export const foldIcsLine = (line: string): string => {
  if (line.length <= ICS_LINE_LENGTH_LIMIT) {
    return line;
  }

  const segments: string[] = [];
  let remaining = line;

  while (remaining.length > ICS_LINE_LENGTH_LIMIT) {
    segments.push(remaining.slice(0, ICS_LINE_LENGTH_LIMIT));
    remaining = remaining.slice(ICS_LINE_LENGTH_LIMIT);
  }

  segments.push(remaining);
  return segments
    .map((segment, index) => (index === 0 ? segment : ` ${segment}`))
    .join("\r\n");
};

export const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

const fnvSeed = 0x811c9dc5;

export const buildDeterministicUid = (
  seed: string,
  domain = "transactioncalendar"
): string => {
  let hash = fnvSeed;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  const hashString = (hash >>> 0).toString(36);
  return `${hashString}@${domain}`;
};

export const toUtcDate = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
    .getDate()
    .toString()
    .padStart(2, "0")}`;
