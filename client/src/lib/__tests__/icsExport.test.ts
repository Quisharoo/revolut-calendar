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
});

