import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ExportModal from "../ExportModal";
import type { ParsedTransaction } from "@shared/schema";
import { detectRecurringSeries } from "@/lib/recurrenceDetection";

const createTransaction = (id: string, date: Date): ParsedTransaction => ({
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
  it("lists only the selected month's recurring series and allows toggling", async () => {
    const recurringJanuary = createTransaction("jan", new Date(2024, 0, 15));
    const recurringFebruary = createTransaction("feb", new Date(2024, 1, 14));
    const recurringMarch = createTransaction("mar", new Date(2024, 2, 15));
    const recurringApril = createTransaction("apr", new Date(2024, 3, 15));
    const oneOff = {
      ...createTransaction("one-off", new Date(2024, 2, 10)),
      amount: -4.5,
      description: "Single coffee",
      source: { name: "Local Cafe", type: "merchant" as const },
    };

    const sourceTransactions = [
      recurringJanuary,
      recurringFebruary,
      recurringMarch,
      recurringApril,
      oneOff,
    ];
    const detection = detectRecurringSeries(sourceTransactions);
    expect(detection.series.length).toBeGreaterThan(0);
    const recurringSeriesId = detection.series[0].id;

    const onClose = vi.fn();
    const onExport = vi.fn();

    render(
      <ExportModal
        series={detection.series}
        isOpen={true}
        onClose={onClose}
        onExport={onExport}
        monthDate={new Date("2024-03-01")}
      />
    );

    const marchCheckbox = await screen.findByLabelText(
      `select-series-${recurringSeriesId}`
    );
    expect(marchCheckbox).toBeInTheDocument();
    expect(marchCheckbox).toBeChecked();

    const exportButton = screen.getByRole("button", { name: /export/i });

    await userEvent.click(marchCheckbox);
    expect(marchCheckbox).not.toBeChecked();
    expect(exportButton).toBeDisabled();

    await userEvent.click(marchCheckbox);
    expect(marchCheckbox).toBeChecked();
    expect(exportButton).toBeEnabled();

    await userEvent.click(exportButton);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
