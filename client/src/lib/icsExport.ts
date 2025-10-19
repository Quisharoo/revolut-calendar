import { ICS_CALENDAR_PROD_ID, APP_TIMEZONE, DEFAULT_CURRENCY_SYMBOL } from "@shared/constants";
import { escapeIcsText, foldIcsLines, hashString } from "@shared/utils";
import type { RecurringSeries } from "@shared/schema";
import { formatCurrency } from "@/lib/transactionUtils";

const ensureTwoDigits = (value: number) => value.toString().padStart(2, "0");

const median = (values: number[]): number => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
};

const formatDateAsUtcTimestamp = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = ensureTwoDigits(date.getUTCMonth() + 1);
  const day = ensureTwoDigits(date.getUTCDate());
  const hours = ensureTwoDigits(date.getUTCHours());
  const minutes = ensureTwoDigits(date.getUTCMinutes());
  const seconds = ensureTwoDigits(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const formatDateAsLocalDateTime = (date: Date) => {
  const year = ensureTwoDigits(date.getFullYear());
  const month = ensureTwoDigits(date.getMonth() + 1);
  const day = ensureTwoDigits(date.getDate());
  const hours = ensureTwoDigits(date.getHours());
  const minutes = ensureTwoDigits(date.getMinutes());
  const seconds = ensureTwoDigits(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

const addLocalDays = (date: Date, days: number) => {
  const clone = new Date(date.getTime());
  clone.setDate(clone.getDate() + days);
  return clone;
};

const buildMonthlyRule = (date: Date) => `FREQ=MONTHLY;BYMONTHDAY=${date.getDate()}`;

const normalizeForSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildSeriesUid = (series: RecurringSeries) => {
  const primary = series.transactions[0] ?? series.representative;
  const descriptorSource =
    primary.source?.identifier ?? primary.source?.name ?? primary.description;
  const slugCandidate = normalizeForSlug(descriptorSource) || "recurring";
  const slug = slugCandidate.slice(0, 48);

  const amounts = series.transactions.map((transaction) => Math.abs(transaction.amount));
  const medianAmount = median(amounts);
  const currency = (primary.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL).trim().toLowerCase();
  const sourceType = primary.source?.type ?? "unknown";

  const stableSeed = [
    series.key,
    medianAmount.toFixed(2),
    currency,
    sourceType,
  ].join("|");
  const hash = hashString(stableSeed);

  return `${slug}-${hash}@transactioncalendar`;
};

const resolveSummary = (series: RecurringSeries) => {
  const label = series.representative.source?.name ?? series.representative.description;
  const formattedAmount = formatCurrency(
    series.representative.amount,
    series.representative.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL
  );
  return `${label} (${formattedAmount})`;
};

const resolveDescription = (series: RecurringSeries) => {
  const direction = series.representative.amount >= 0 ? "Income" : "Expense";
  const occurrences = series.transactions.length;
  const first = series.transactions[0];
  const last = series.transactions[series.transactions.length - 1];
  return [
    `${direction} • ${series.representative.description}`,
    `Occurrences: ${occurrences}`,
    `Span: ${first.date.toISOString().slice(0, 10)} → ${last.date
      .toISOString()
      .slice(0, 10)}`,
  ].join("\n");
};

const pickOccurrenceForMonth = (series: RecurringSeries, monthDate: Date) => {
  const targetYear = monthDate.getFullYear();
  const targetMonth = monthDate.getMonth();
  return series.transactions.find(
    (transaction) =>
      transaction.date.getFullYear() === targetYear &&
      transaction.date.getMonth() === targetMonth
  );
};

export interface BuildRecurringIcsOptions {
  monthDate: Date;
  calendarName?: string;
  timezone?: string;
  selectedSeriesIds?: string[];
}

export interface BuildRecurringIcsStats {
  eventCount: number;
  exportedSeriesIds: string[];
  skippedSeriesIds: string[];
}

export interface BuildRecurringIcsResult {
  icsText: string;
  stats: BuildRecurringIcsStats;
}

export const buildRecurringIcs = (
  series: RecurringSeries[],
  {
    monthDate,
    calendarName = "Recurring Transactions",
    timezone = APP_TIMEZONE,
    selectedSeriesIds,
  }: BuildRecurringIcsOptions
): BuildRecurringIcsResult => {
  const timestamp = formatDateAsUtcTimestamp(new Date());

  const filteredSeries = Array.isArray(selectedSeriesIds)
    ? series.filter((entry) => selectedSeriesIds.includes(entry.id))
    : series;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `PRODID:${ICS_CALENDAR_PROD_ID}`,
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    `X-WR-TIMEZONE:${escapeIcsText(timezone)}`,
  ];

  const exportedSeriesIds: string[] = [];
  const skippedSeriesIds: string[] = [];

  filteredSeries.forEach((entry) => {
    const occurrence = pickOccurrenceForMonth(entry, monthDate);
    if (!occurrence) {
      skippedSeriesIds.push(entry.id);
      return;
    }

    const startUtc = new Date(
      Date.UTC(
        occurrence.date.getFullYear(),
        occurrence.date.getMonth(),
        occurrence.date.getDate(),
        0,
        0,
        0,
        0
      )
    );
    const endUtc = new Date(
      Date.UTC(
        occurrence.date.getFullYear(),
        occurrence.date.getMonth(),
        occurrence.date.getDate() + 1,
        0,
        0,
        0,
        0
      )
    );

    const startLocal = new Date(
      occurrence.date.getFullYear(),
      occurrence.date.getMonth(),
      occurrence.date.getDate(),
      0,
      0,
      0,
      0
    );
    const endLocal = addLocalDays(startLocal, 1);

    const timezoneKey = timezone.trim();
    const isUtc = timezoneKey.toUpperCase() === "UTC" || timezoneKey.toUpperCase() === "ETC/UTC";

    const eventLines = [
      "BEGIN:VEVENT",
      `UID:${buildSeriesUid(entry)}`,
      `DTSTAMP:${timestamp}`,
      `SUMMARY:${escapeIcsText(resolveSummary({ ...entry, representative: occurrence }))}`,
      `DESCRIPTION:${escapeIcsText(resolveDescription({ ...entry, representative: occurrence }))}`,
      isUtc
        ? `DTSTART:${formatDateAsUtcTimestamp(startUtc)}`
        : `DTSTART;TZID=${escapeIcsText(timezoneKey)}:${formatDateAsLocalDateTime(startLocal)}`,
      isUtc
        ? `DTEND:${formatDateAsUtcTimestamp(endUtc)}`
        : `DTEND;TZID=${escapeIcsText(timezoneKey)}:${formatDateAsLocalDateTime(endLocal)}`,
      `RRULE:${buildMonthlyRule(occurrence.date)}`,
      "END:VEVENT",
    ];

    exportedSeriesIds.push(entry.id);
    foldIcsLines(eventLines).forEach((line) => lines.push(line));
  });

  lines.push("END:VCALENDAR");

  return {
    icsText: lines.join("\r\n"),
    stats: {
      eventCount: exportedSeriesIds.length,
      exportedSeriesIds,
      skippedSeriesIds,
    },
  };
};
