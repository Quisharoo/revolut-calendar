import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ExportModal from "../ExportModal";

const mockTx = (overrides: any = {}) => ({
  id: Math.random().toString(36).slice(2),
  date: new Date(),
  description: "Monthly subscription",
  amount: -9.99,
  category: "Subscription",
  currencySymbol: "$",
  source: { name: "Test" },
  isRecurring: true,
  ...overrides,
});

describe("ExportModal", () => {
  it("renders recurring transactions with checkboxes and allows selection", async () => {
    const txs = [mockTx({ id: 'a' }), mockTx({ id: 'b' })];
    const onClose = vi.fn();
    const onExport = vi.fn();

    render(<ExportModal transactions={txs} isOpen={true} onClose={onClose} onExport={onExport} />);

  const checkboxA = await screen.findByLabelText(`select-transaction-${txs[0].id}`);
  expect(checkboxA).toBeInTheDocument();
  // initial state should be checked
  expect(checkboxA).toBeChecked();
  await userEvent.click(checkboxA);
  // clicking should toggle selection
  expect(checkboxA).not.toBeChecked();
  });
});
