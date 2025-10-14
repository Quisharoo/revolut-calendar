import type { ParsedTransaction } from "@shared/schema";
import { DEFAULT_CURRENCY_SYMBOL, formatCurrency } from "@/lib/transactionUtils";

const CALENDAR_PROD_ID = "-//TransactionCalendar//Recurring Export//EN";

const ensureTwoDigits = (value: number) => value.toString().padStart(2, "0");

const formatDateAsDateValue = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = ensureTwoDigits(date.getUTCMonth() + 1);
  const day = ensureTwoDigits(date.getUTCDate());
  return `${year}${month}${day}`;
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

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const addUtcDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

const buildMonthlyRule = (date: Date) => {
  const day = date.getUTCDate();
  return `FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=${day}`;
};

const resolveSummary = (transaction: ParsedTransaction) => {
  const label = transaction.source?.name ?? transaction.description;
  const formattedAmount = formatCurrency(
    transaction.amount,
    transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL
  );
  return `${label} (${formattedAmount})`;
};

const resolveDescription = (transaction: ParsedTransaction) => {
  const direction = transaction.amount >= 0 ? "Income" : "Expense";
  return `${direction} • ${transaction.description}`;
};

const normalizeTextForKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const hashString = (value: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

const buildRecurringKey = (transaction: ParsedTransaction) => {
  const descriptorSource =
    transaction.source?.identifier ??
    transaction.source?.name ??
    transaction.description;
  const normalizedDescriptor = normalizeTextForKey(descriptorSource);
  const normalizedDescription = normalizeTextForKey(transaction.description);
  const descriptor =
    normalizedDescriptor || normalizedDescription || "recurring-transaction";

  const amount = Math.abs(transaction.amount).toFixed(2);
  const currency = (transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL)
    .trim()
    .toLowerCase();
  const direction = transaction.amount >= 0 ? "credit" : "debit";
  const sourceType = transaction.source?.type ?? "unknown";

  return [descriptor, amount, currency, direction, sourceType].join("|");
};

const buildRecurringUid = (transaction: ParsedTransaction) => {
  const key = buildRecurringKey(transaction);
  const slugCandidate =
    toSlug(transaction.source?.name ?? transaction.description) || "recurring";
  const slug = slugCandidate.slice(0, 48);
  const hash = hashString(key);
  const idPart = [slug, hash].filter(Boolean).join("-");
  return `${idPart}@transactioncalendar`;
};

const buildUid = (transaction: ParsedTransaction) => {
  if (transaction.isRecurring) {
    return buildRecurringUid(transaction);
  }

  const safeId = transaction.id.replace(/[^a-zA-Z0-9-]/g, "");
  if (safeId.length > 0) {
    return `${safeId}@transactioncalendar`;
  }

  const fallbackSeed = [
    normalizeTextForKey(transaction.description) || "transaction",
    transaction.date.toISOString(),
    Math.abs(transaction.amount).toFixed(2),
    (transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL).trim().toLowerCase(),
  ].join("|");
  const deterministicPart = hashString(fallbackSeed);

  return `auto-${deterministicPart}@transactioncalendar`;
};

const createUtcDate = (year: number, monthIndex: number, day: number) =>
  new Date(Date.UTC(year, monthIndex, day));

const getUtcYearMonth = (date: Date) => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth(),
});

const isSameUtcMonth = (date: Date, target: { year: number; month: number }) =>
  date.getUTCFullYear() === target.year && date.getUTCMonth() === target.month;

export const filterRecurringTransactionsForMonth = (
  transactions: ParsedTransaction[],
  monthDate: Date
) => {
  const target = getUtcYearMonth(monthDate);
  return transactions.filter(
    (transaction) => transaction.isRecurring && isSameUtcMonth(transaction.date, target)
  );
};

export interface BuildRecurringIcsOptions {
  monthDate: Date;
  calendarName?: string;
}

export const buildRecurringIcs = (
  transactions: ParsedTransaction[],
  { monthDate, calendarName = "Recurring Transactions" }: BuildRecurringIcsOptions
) => {
  const { year: targetYear, month: targetMonth } = getUtcYearMonth(monthDate);

  const recurringTransactions = filterRecurringTransactionsForMonth(transactions, monthDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${CALENDAR_PROD_ID}`,
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  const exportTimestamp = formatDateAsUtcTimestamp(new Date());

  const emittedRecurringKeys = new Set<string>();

  recurringTransactions.forEach((transaction) => {
    if (transaction.isRecurring) {
      const recurringKey = buildRecurringKey(transaction);
      if (emittedRecurringKeys.has(recurringKey)) {
        return;
      }
      emittedRecurringKeys.add(recurringKey);
    }

    const startDate = createUtcDate(
      targetYear,
      targetMonth,
      transaction.date.getUTCDate()
    );
    const endDate = addUtcDays(startDate, 1);
    const rrule = buildMonthlyRule(transaction.date);

    lines.push(
      "BEGIN:VEVENT",
      `UID:${buildUid(transaction)}`,
      `DTSTAMP:${exportTimestamp}`,
      `SUMMARY:${escapeIcsText(resolveSummary(transaction))}`,
      `DESCRIPTION:${escapeIcsText(resolveDescription(transaction))}`,
      `DTSTART;VALUE=DATE:${formatDateAsDateValue(startDate)}`,
      `DTEND;VALUE=DATE:${formatDateAsDateValue(endDate)}`,
      `RRULE:${rrule}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
};
