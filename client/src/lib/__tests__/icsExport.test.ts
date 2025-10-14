import { describe, it, expect } from "vitest";
import type { ParsedTransaction } from "@shared/schema";
import { buildRecurringIcs } from "../icsExport";

const createTransaction = (overrides: Partial<ParsedTransaction>): ParsedTransaction => ({
  id: "tx-1",
  date: new Date(2024, 0, 5),
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
    const transactions: ParsedTransaction[] = [
      createTransaction({
        id: "rent-jan",
        description: "Rent Payment",
        date: new Date(2024, 0, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
        isRecurring: true,
      }),
      createTransaction({
        id: "rent-feb",
        description: "Rent Payment",
        date: new Date(2024, 1, 3),
        amount: -1800,
        category: "Expense",
        currencySymbol: "€",
        isRecurring: true,
      }),
      createTransaction({
        id: "one-off",
        description: "One-off Purchase",
        date: new Date(2024, 0, 10),
        amount: -120,
        category: "Expense",
        isRecurring: false,
      }),
    ];

    const ics = buildRecurringIcs(transactions, {
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
    expect(ics).toContain("DTSTART;VALUE=DATE:20240103");
    expect(ics).toContain("DTEND;VALUE=DATE:20240104");
    expect(ics).toContain("RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=3");
  });

  it("reuses a stable UID for the same recurring transaction across months", () => {
    const januaryRent = createTransaction({
      id: "rent-jan-uid",
      description: "Rent Payment",
      date: new Date(2024, 0, 3),
      amount: -1800,
      category: "Expense",
      currencySymbol: "€",
      isRecurring: true,
    });

    const februaryRent = createTransaction({
      id: "rent-feb-uid",
      description: "Rent Payment",
      date: new Date(2024, 1, 3),
      amount: -1800,
      category: "Expense",
      currencySymbol: "€",
      isRecurring: true,
    });

    const januaryIcs = buildRecurringIcs([januaryRent], {
      monthDate: new Date(2024, 0, 1),
    });
    const februaryIcs = buildRecurringIcs([februaryRent], {
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

    const ics = buildRecurringIcs(transactions, {
      monthDate: new Date(2024, 0, 1),
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(0);
  });

  it("skips duplicate recurring entries that share the same recurrence key", () => {
    const transactions: ParsedTransaction[] = [
      createTransaction({
        id: "gym-jan-a",
        description: "Gym Membership",
        date: new Date(2024, 0, 12),
        amount: -45,
        category: "Expense",
        currencySymbol: "$",
        isRecurring: true,
      }),
      createTransaction({
        id: "gym-jan-b",
        description: "Gym Membership",
        date: new Date(2024, 0, 15),
        amount: -45,
        category: "Expense",
        currencySymbol: "$",
        isRecurring: true,
      }),
    ];

    const ics = buildRecurringIcs(transactions, {
      monthDate: new Date(2024, 0, 1),
    });

    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(1);
  });
});
