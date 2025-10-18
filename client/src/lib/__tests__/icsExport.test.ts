import { describe, it, expect } from "vitest";
import type { ParsedTransaction, RecurringSeries } from "@shared/schema";
import { buildRecurringIcs } from "../icsExport";
import { getGroupingKey } from "../recurrenceDetection";

const createTransaction = (
  overrides: Partial<ParsedTransaction> & { id: string; date: Date }
): ParsedTransaction => ({
  id: overrides.id,
  date: overrides.date,
  description: overrides.description ?? "Sample",
  amount: overrides.amount ?? -50,
  category: overrides.category ?? "Expense",
  currencySymbol: overrides.currencySymbol ?? "$",
  source: overrides.source ?? {
    name: overrides.description ?? "Sample",
    type: "merchant",
  },
  broker: overrides.broker,
  isRecurring: overrides.isRecurring ?? true,
});

const median = (values: number[]) => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
};

const diffInDays = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));

const buildSeriesFixture = (
  id: string,
  transactions: ParsedTransaction[]
): RecurringSeries => {
  const sorted = [...transactions].sort(
    (first, second) => first.date.getTime() - second.date.getTime()
  );
  const currency = sorted[0]?.currencySymbol ?? "$";

  const spans: number[] = [];
  const gaps = sorted.slice(1).map((transaction, index) => {
    const previous = sorted[index];
    const days = diffInDays(previous.date, transaction.date);
    spans.push(days);
    return { from: previous.date, to: transaction.date, days };
  });

  const weekdayDrift = sorted.slice(1).reduce((max, transaction, index) => {
    const previous = sorted[index];
    const drift = Math.abs(transaction.date.getDay() - previous.date.getDay());
    return Math.max(max, drift);
  }, 0);

  const amounts = sorted.map((transaction) => Math.abs(transaction.amount));
  const referenceAmount = median(amounts);
  const deltas = sorted.map((transaction) =>
    Math.abs(Math.abs(transaction.amount) - referenceAmount)
  );
  const amountDelta = {
    min: Number.isFinite(Math.min(...deltas)) ? Math.min(...deltas) : 0,
    max: Number.isFinite(Math.max(...deltas)) ? Math.max(...deltas) : 0,
    average:
      deltas.length > 0
        ? deltas.reduce((total, value) => total + value, 0) / deltas.length
        : 0,
    currencySymbol: currency,
  };

  const explanation: RecurringSeries["explanation"] = {
    occurrenceIds: sorted.map((transaction) => transaction.id),
    occurrenceDates: sorted.map((transaction) => transaction.date),
    minSpanDays: spans.length ? Math.min(...spans) : 0,
    maxSpanDays: spans.length ? Math.max(...spans) : 0,
    weekdayDriftDays: weekdayDrift,
    gaps,
    amountDelta,
    notes: [`Median amount ${currency}${referenceAmount.toFixed(2)}`],
  };

  return {
    id,
    key: getGroupingKey(sorted[0]),
    cadence: "monthly",
    transactions: sorted,
    representative: sorted[sorted.length - 1],
    explanation,
  };
};

describe("buildRecurringIcs", () => {
  it("generates an event for each selected series in the given month", () => {
    const occurrences = [
      createTransaction({ id: "rent-jan", date: new Date(2024, 0, 3), amount: -1800, description: "Rent", currencySymbol: "€" }),
      createTransaction({ id: "rent-feb", date: new Date(2024, 1, 3), amount: -1800, description: "Rent", currencySymbol: "€" }),
      createTransaction({ id: "rent-mar", date: new Date(2024, 2, 3), amount: -1800, description: "Rent", currencySymbol: "€" }),
      createTransaction({ id: "rent-apr", date: new Date(2024, 3, 10), amount: -1800, description: "Rent", currencySymbol: "€" }),
    ];

    const series = buildSeriesFixture("rent-series", occurrences);

    const result = buildRecurringIcs([series], {
      monthDate: new Date(2024, 0, 1),
      calendarName: "Recurring Transactions - January 2024",
    });

    expect(result.stats.eventCount).toBe(1);
    expect(result.icsText).toContain("BEGIN:VCALENDAR");
    expect(result.icsText).toContain("SUMMARY:Rent (-€1\\,800.00)");
    expect(result.icsText).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=3");
  });

  it("reuses a stable UID for the same series across months", () => {
    const occurrences = [
      createTransaction({ id: "salary-jan", date: new Date(2024, 0, 25), amount: 2500, category: "Income", description: "Salary" }),
      createTransaction({ id: "salary-feb", date: new Date(2024, 1, 26), amount: 2510, category: "Income", description: "Salary" }),
      createTransaction({ id: "salary-mar", date: new Date(2024, 2, 25), amount: 2490, category: "Income", description: "Salary" }),
      createTransaction({ id: "salary-apr", date: new Date(2024, 3, 25), amount: 2505, category: "Income", description: "Salary" }),
    ];

    const series = buildSeriesFixture("salary-series", occurrences);

    const january = buildRecurringIcs([series], { monthDate: new Date(2024, 0, 1) });
    const february = buildRecurringIcs([series], { monthDate: new Date(2024, 1, 1) });

    const extractUid = (ics: string) => (
      ics.match(/UID:([^\r\n]+)/)?.[1] ?? null
    );

    const januaryUid = extractUid(january.icsText);
    const februaryUid = extractUid(february.icsText);

    expect(januaryUid).toBeTruthy();
    expect(januaryUid).toBe(februaryUid);
  });

  it("records skipped series when no occurrence is available for the target month", () => {
    const occurrences = [
      createTransaction({ id: "rent-jan", date: new Date(2024, 0, 3), amount: -1800, description: "Rent" }),
      createTransaction({ id: "rent-feb", date: new Date(2024, 1, 3), amount: -1800, description: "Rent" }),
      createTransaction({ id: "rent-mar", date: new Date(2024, 2, 3), amount: -1800, description: "Rent" }),
      createTransaction({ id: "rent-apr", date: new Date(2024, 3, 10), amount: -1800, description: "Rent" }),
    ];

    const series = buildSeriesFixture("rent-series", occurrences);

    const result = buildRecurringIcs([series], { monthDate: new Date(2024, 5, 1) });

    expect(result.stats.eventCount).toBe(0);
    expect(result.stats.exportedSeriesIds).toHaveLength(0);
    expect(result.stats.skippedSeriesIds).toEqual([series.id]);
  });
});
