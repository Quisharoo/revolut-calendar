import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ExportModal from "../ExportModal";
import {
  summarizeRecurringTransactionsForMonth,
  applyRecurringDetection,
  detectRecurringTransactions,
} from "@/lib/recurrenceDetection";

const createTransaction = (id: string, date: Date) => ({
  id,
  date,
  description: "Monthly subscription",
  amount: -9.99,
  category: "Expense",
  currencySymbol: "$",
  source: { name: "Subscription", type: "merchant" as const },
  isRecurring: false,
});

describe("ExportModal", () => {
  it("lists only the selected month's recurring instances and allows toggling", async () => {
    const recurringJanuary = createTransaction("jan", new Date(2024, 0, 15));
    const recurringFebruary = createTransaction("feb", new Date(2024, 1, 14));
    const recurringMarch = createTransaction("mar", new Date(2024, 2, 15));
    const oneOff = {
      ...createTransaction("one-off", new Date(2024, 2, 10)),
      amount: -4.5,
      description: "Single coffee",
      source: { name: "Local Cafe", type: "merchant" as const },
    };

    const transactions = [recurringJanuary, recurringFebruary, recurringMarch, oneOff];

    transactions.forEach((transaction) => {
      expect(transaction.date instanceof Date).toBe(true);
      expect(Number.isNaN(transaction.date.getTime())).toBe(false);
    });

    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const diffJanFeb = Math.round(
      Math.abs(recurringFebruary.date.getTime() - recurringJanuary.date.getTime()) /
        MS_PER_DAY
    );
    const diffFebMar = Math.round(
      Math.abs(recurringMarch.date.getTime() - recurringFebruary.date.getTime()) /
        MS_PER_DAY
    );
    expect([diffJanFeb, diffFebMar]).toEqual([30, 30]);

    const recurringIds = detectRecurringTransactions(transactions);
    expect(Array.from(recurringIds).sort()).toEqual(["feb", "jan", "mar"]);

    const annotated = applyRecurringDetection(transactions);
    expect(
      annotated.filter((tx) => tx.isRecurring).map((tx) => tx.id).sort()
    ).toEqual(["feb", "jan", "mar"]);

    const summaries = summarizeRecurringTransactionsForMonth(
      transactions,
      new Date(2024, 2, 1)
    );
    expect(summaries).toHaveLength(1);
    expect(summaries[0].representative.id).toBe("mar");

    const onClose = vi.fn();
    const onExport = vi.fn();

    render(
      <ExportModal
        transactions={transactions}
        isOpen={true}
        onClose={onClose}
        onExport={onExport}
        monthDate={new Date("2024-03-01")}
      />
    );

    const marchCheckbox = await screen.findByLabelText("select-transaction-mar");
    expect(marchCheckbox).toBeInTheDocument();
    expect(marchCheckbox).toBeChecked();

    expect(screen.queryByLabelText("select-transaction-jan")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("select-transaction-feb")).not.toBeInTheDocument();

    await userEvent.click(marchCheckbox);
    expect(marchCheckbox).not.toBeChecked();

    await userEvent.click(marchCheckbox);
    expect(marchCheckbox).toBeChecked();
  });
});
