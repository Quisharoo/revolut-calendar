import { describe, it, expect } from "vitest";
import type { ParsedTransaction } from "../../../../shared/schema";
import { buildRecurringIcs, filterRecurringTransactionsForMonth } from "../icsExport";
import { applyRecurringDetection } from "../recurrenceDetection";

const createTransaction = (
  overrides: Partial<ParsedTransaction> = {}
): ParsedTransaction => ({
  id: "tx-1",
  date: new Date(Date.UTC(2024, 0, 5, 12)),
  description: "Sample",
  amount: -50,
  category: "Expense",
  isRecurring: false,
  ...overrides,
});

const extractUids = (ics: string) =>
  (ics.match(/UID:(.+)/g) ?? []).map((line) => line.replace("UID:", "").trim());

describe("buildRecurringIcs", () => {
  it("includes recurring transactions for the target month with monthly recurrence", () => {
    let transactions: ParsedTransaction[] = [
      createTransaction({
        id: "rent-jan",
        description: "Rent Payment",
        date: new Date(2024, 0, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
      }),
      createTransaction({
        id: "rent-feb",
        description: "Rent Payment",
        date: new Date(2024, 1, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
      }),
      createTransaction({
        id: "rent-mar",
        description: "Rent Payment",
        date: new Date(2024, 2, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
      }),
      createTransaction({
        id: "one-off",
        description: "One-off Purchase",
        date: new Date(2024, 0, 10),
        amount: -120,
        category: "Expense",
      }),
    ];
    transactions = applyRecurringDetection(transactions);

    const ics = buildRecurringIcs([transactions[2]], {
      monthDate: new Date(2024, 0, 1),
      calendarName: "Recurring Transactions - January 2024",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("PRODID:-//TransactionCalendar//Recurring Export//EN");
    expect(ics).toContain("X-WR-CALNAME:Recurring Transactions - January 2024");

    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(1);

    expect(ics).toContain("SUMMARY:Rent Payment (-€1\\,800.00)");
    expect(ics).toContain("DESCRIPTION:Expense • Rent Payment");
    expect(ics).toContain("DTSTART;VALUE=DATE:20240103"); // Should match recurring day
    expect(ics).toContain("DTEND;VALUE=DATE:20240104");
    expect(ics).toContain("RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=3");
  });

  it("reuses a stable UID for the same recurring transaction across months", () => {
    const rentTxs = [
      createTransaction({
        id: "rent-jan-uid",
        description: "Rent Payment",
        date: new Date(2024, 0, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
      }),
      createTransaction({
        id: "rent-feb-uid",
        description: "Rent Payment",
        date: new Date(2024, 1, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
      }),
      createTransaction({
        id: "rent-mar-uid",
        description: "Rent Payment",
        date: new Date(2024, 2, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
      }),
    ];
    const annotated = applyRecurringDetection(rentTxs);
    const januaryIcs = buildRecurringIcs(annotated, {
      monthDate: new Date(2024, 0, 1),
    });
    const februaryIcs = buildRecurringIcs(annotated, {
      monthDate: new Date(2024, 1, 1),
    });
    const januaryUids = extractUids(januaryIcs);
    const februaryUids = extractUids(februaryIcs);
    expect(januaryUids).toHaveLength(1);
    expect(februaryUids).toHaveLength(1);
    expect(januaryUids[0]).toBe(februaryUids[0]);
  });

  it("omits events when no recurring transactions are present for the month", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({
        id: "single",
        description: "Gym Membership",
        date: new Date(2024, 2, 1),
        isRecurring: false,
      }),
    ];

    // No recurring series selected, so pass empty array
    const ics = buildRecurringIcs([], {
      monthDate: new Date(2024, 0, 1),
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(0);
  });

  it("skips duplicate recurring entries that share the same recurrence key", () => {
    const gymTxs = [
      createTransaction({
        id: "gym-jan-a",
        description: "Gym Membership",
        date: new Date(2024, 0, 12),
        amount: -45,
        category: "Expense",
        currencySymbol: "$",
      }),
      createTransaction({
        id: "gym-jan-b",
        description: "Gym Membership",
        date: new Date(2024, 0, 15),
        amount: -45,
        category: "Expense",
        currencySymbol: "$",
      }),
      createTransaction({
        id: "gym-feb",
        description: "Gym Membership",
        date: new Date(2024, 1, 12),
        amount: -45,
        category: "Expense",
        currencySymbol: "$",
      }),
      createTransaction({
        id: "gym-mar",
        description: "Gym Membership",
        date: new Date(2024, 2, 12),
        amount: -45,
        category: "Expense",
        currencySymbol: "$",
      }),
    ];
    const annotated = applyRecurringDetection(gymTxs);
    const ics = buildRecurringIcs(annotated, {
      monthDate: new Date(2024, 0, 1),
    });
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(1);
  });
});

describe("filterRecurringTransactionsForMonth", () => {
  it("returns recurring transactions that match the target month in UTC", () => {
    const transactions = [
      createTransaction({
        id: "jan-recurring",
        isRecurring: true,
        date: new Date(Date.UTC(2024, 0, 10, 23)),
      }),
      createTransaction({
        id: "jan-non",
        isRecurring: false,
        date: new Date(Date.UTC(2024, 0, 10)),
      }),
      createTransaction({
        id: "feb-recurring",
        isRecurring: true,
        date: new Date(Date.UTC(2024, 1, 2)),
      }),
    ];

    const result = filterRecurringTransactionsForMonth(transactions, new Date(Date.UTC(2024, 0, 1)));
    expect(result.map((tx) => tx.id)).toEqual(["jan-recurring"]);
  });
});

describe("uid generation", () => {
  it("generates consistent UIDs for recurring transactions regardless of ID content", () => {
    const txs = [
      createTransaction({ id: "###", description: "Recurring", date: new Date(2024, 0, 5), amount: -100 }),
      createTransaction({ id: "$$$", description: "Recurring", date: new Date(2024, 1, 5), amount: -100 }),
      createTransaction({ id: "@@@", description: "Recurring", date: new Date(2024, 2, 5), amount: -100 }),
    ];
    const annotated = applyRecurringDetection(txs);
    const first = buildRecurringIcs(annotated, { monthDate: new Date(2024, 0, 1) });
    const second = buildRecurringIcs(annotated, { monthDate: new Date(2024, 0, 1) });
    const [firstUid] = extractUids(first);
    const [secondUid] = extractUids(second);
    expect(firstUid).toBeDefined();
    expect(firstUid).toBe(secondUid);
    expect(firstUid?.endsWith("@transactioncalendar")).toBe(true);
  });

  it("does not shift DTSTART across timezones", () => {
    const txs = [
      createTransaction({ id: "tz-check-1", description: "TZ Recurring", date: new Date("2024-03-01T00:30:00Z"), amount: -100 }),
      createTransaction({ id: "tz-check-2", description: "TZ Recurring", date: new Date("2024-04-01T00:30:00Z"), amount: -100 }),
      createTransaction({ id: "tz-check-3", description: "TZ Recurring", date: new Date("2024-05-01T00:30:00Z"), amount: -100 }),
    ];
    const annotated = applyRecurringDetection(txs);
    const ics = buildRecurringIcs(annotated, { monthDate: new Date(Date.UTC(2024, 2, 1)) });
    expect(ics).toContain("DTSTART;VALUE=DATE:20240301");
    expect(ics).toContain("DTEND;VALUE=DATE:20240302");
  });
});
