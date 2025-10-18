import { describe, it, expect } from "vitest";
import type { RecurringSeries } from "@shared/schema";
import { buildRecurringSeriesIcs } from "../icsExport";

const createSeries = (overrides: Partial<RecurringSeries> = {}): RecurringSeries => ({
  id: "series-1",
  label: "Rent Payment",
  transactionIds: ["rent-jan", "rent-feb", "rent-mar"],
  direction: "debit",
  amount: -1800,
  currencySymbol: "€",
  startDate: new Date(Date.UTC(2023, 10, 3)),
  endDate: new Date(Date.UTC(2024, 2, 3)),
  rrule: "FREQ=MONTHLY;BYMONTHDAY=3",
  explanation: {
    occurrences: [
      { id: "rent-jan", date: new Date(Date.UTC(2023, 10, 3)), amount: -1800, delta: 0 },
      { id: "rent-feb", date: new Date(Date.UTC(2023, 11, 3)), amount: -1800, delta: 0 },
      { id: "rent-mar", date: new Date(Date.UTC(2024, 0, 3)), amount: -1800, delta: 0 },
    ],
    totalSpanDays: 120,
    gaps: [],
  },
  ...overrides,
});

const extractUids = (ics: string) =>
  (ics.match(/UID:(.+)/g) ?? []).map((line) => line.replace("UID:", "").trim());

describe("buildRecurringSeriesIcs", () => {
  it("produces a VCALENDAR with timezone metadata and folded lines", () => {
    const { icsText, events } = buildRecurringSeriesIcs(
      [createSeries()],
      {
        monthDate: new Date(Date.UTC(2024, 0, 1)),
        calendarName: "Recurring Transactions - January 2024",
      }
    );

    expect(events).toBe(1);
    expect(icsText).toContain("BEGIN:VCALENDAR");
    expect(icsText).toContain("PRODID:-//TransactionCalendar//Recurring Export//EN");
    expect(icsText).toContain("X-WR-TIMEZONE:Europe/Dublin");
    expect(icsText).toMatch(/SUMMARY:Rent Payment \(-€1\\,800\.00\)/);
    expect(icsText).toContain("DESCRIPTION:Expense • 3 occurrences • span 120 days");
    expect(icsText).toContain("DTSTART;TZID=Europe/Dublin:20240103T000000");
    expect(icsText).toContain("DTEND;TZID=Europe/Dublin:20240104T000000");
    expect(icsText).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=3");
  });

  it("reuses a stable UID derived from the recurring series", () => {
    const base = createSeries({ id: "series-uid" });

    const january = buildRecurringSeriesIcs([base], {
      monthDate: new Date(Date.UTC(2024, 0, 1)),
    });
    const february = buildRecurringSeriesIcs([base], {
      monthDate: new Date(Date.UTC(2024, 1, 1)),
    });

    const januaryUids = extractUids(january.icsText);
    const februaryUids = extractUids(february.icsText);

    expect(januaryUids).toHaveLength(1);
    expect(februaryUids).toHaveLength(1);
    expect(januaryUids[0]).toBe(februaryUids[0]);
  });

  it("emits no VEVENT blocks when no series are provided", () => {
    const { icsText, events } = buildRecurringSeriesIcs([], {
      monthDate: new Date(Date.UTC(2024, 0, 1)),
    });

    expect(events).toBe(0);
    expect(icsText).toContain("BEGIN:VCALENDAR");
    expect(icsText).toContain("END:VCALENDAR");
    expect(icsText.match(/BEGIN:VEVENT/g)).toBeNull();
  });

  it("folds long lines to satisfy RFC 5545", () => {
    const verboseSeries = createSeries({
      label: "Extremely verbose recurring payment description for compliance",
    });

    const { icsText } = buildRecurringSeriesIcs([verboseSeries], {
      monthDate: new Date(Date.UTC(2024, 0, 1)),
    });

    const foldedSummary = icsText.match(/SUMMARY:.+\r\n .+/);
    expect(foldedSummary).toBeTruthy();
  });
});
