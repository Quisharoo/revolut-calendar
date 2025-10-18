import type { RecurringSeries } from "@shared/schema";
import { DEFAULT_TIMEZONE } from "@shared/constants";
import { escapeIcsText, foldIcsLine, toUtcDate } from "@shared/utils";
import { formatCurrency, DEFAULT_CURRENCY_SYMBOL } from "@/lib/transactionUtils";

const CALENDAR_PROD_ID = "-//TransactionCalendar//Recurring Export//EN";

const ensureTwoDigits = (value: number) => value.toString().padStart(2, "0");

const formatLocalTimestamp = (date: Date) => {
  const year = date.getFullYear();
  const month = ensureTwoDigits(date.getMonth() + 1);
  const day = ensureTwoDigits(date.getDate());
  return `${year}${month}${day}T000000`;
};

const formatUtcTimestamp = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = ensureTwoDigits(date.getUTCMonth() + 1);
  const day = ensureTwoDigits(date.getUTCDate());
  const hours = ensureTwoDigits(date.getUTCHours());
  const minutes = ensureTwoDigits(date.getUTCMinutes());
  const seconds = ensureTwoDigits(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const addUtcDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const buildSummary = (series: RecurringSeries) => {
  const amount = formatCurrency(
    series.amount,
    series.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL
  );
  return `${series.label} (${amount})`;
};

const buildDescription = (series: RecurringSeries) => {
  const direction = series.direction === "credit" ? "Income" : "Expense";
  const occurrenceCount = series.transactionIds.length;
  const span = series.explanation.totalSpanDays;
  return `${direction} • ${occurrenceCount} occurrences • span ${span} days`;
};

const resolveEventDates = (series: RecurringSeries, monthDate: Date) => {
  const base = toUtcDate(new Date(monthDate));
  const start = new Date(base);
  start.setUTCDate(series.startDate.getUTCDate());
  const end = addUtcDays(start, 1);
  return { start, end };
};

export interface BuildIcsOptions {
  monthDate: Date;
  calendarName?: string;
}

export const buildRecurringSeriesIcs = (
  series: RecurringSeries[],
  { monthDate, calendarName = "Recurring Transactions" }: BuildIcsOptions
) => {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    foldIcsLine(`PRODID:${CALENDAR_PROD_ID}`),
    foldIcsLine(`X-WR-CALNAME:${escapeIcsText(calendarName)}`),
    foldIcsLine(`X-WR-TIMEZONE:${DEFAULT_TIMEZONE}`),
  ];

  const exportTimestamp = formatUtcTimestamp(new Date());

  series.forEach((item) => {
    const { start, end } = resolveEventDates(item, monthDate);
    const summary = escapeIcsText(buildSummary(item));
    const description = escapeIcsText(buildDescription(item));
    const dtStart = formatLocalTimestamp(start);
    const dtEnd = formatLocalTimestamp(end);

    [
      "BEGIN:VEVENT",
      `UID:${item.id}`,
      `DTSTAMP:${exportTimestamp}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `DTSTART;TZID=${DEFAULT_TIMEZONE}:${dtStart}`,
      `DTEND;TZID=${DEFAULT_TIMEZONE}:${dtEnd}`,
      `RRULE:${item.rrule}`,
      `X-TRANSACTION-COUNT:${item.transactionIds.length}`,
      "END:VEVENT",
    ].forEach((line) => lines.push(foldIcsLine(line)));
  });

  lines.push("END:VCALENDAR");

  return {
    icsText: lines.join("\r\n"),
    events: series.length,
    generatedAt: exportTimestamp,
  };
};
