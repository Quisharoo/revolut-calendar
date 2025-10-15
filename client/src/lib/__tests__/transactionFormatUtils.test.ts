import { describe, expect, it } from "vitest";
import type { ParsedTransaction } from "@shared/schema";
import {
  getTransactionCurrency,
  getNormalizedCurrency,
  formatAmountFixed,
  getTransactionDirection,
  getFlowDirection,
  getFlowType,
} from "../transactionFormatUtils";

const createTransaction = (overrides: Partial<ParsedTransaction>): ParsedTransaction => ({
  id: "test-id",
  date: new Date("2024-01-01"),
  description: "Test Transaction",
  amount: 100,
  category: "Income",
  source: { name: "Test Source", type: "merchant" },
  currencySymbol: "$",
  isRecurring: false,
  ...overrides,
});

describe("getTransactionCurrency", () => {
  it("returns the transaction currency symbol when set", () => {
    const transaction = createTransaction({ currencySymbol: "€" });
    expect(getTransactionCurrency(transaction)).toBe("€");
  });

  it("returns default currency symbol when not set", () => {
    const transaction = createTransaction({ currencySymbol: undefined });
    expect(getTransactionCurrency(transaction)).toBe("$");
  });
});

describe("getNormalizedCurrency", () => {
  it("returns lowercase trimmed currency symbol", () => {
    const transaction = createTransaction({ currencySymbol: " EUR " });
    expect(getNormalizedCurrency(transaction)).toBe("eur");
  });

  it("handles symbols that are already lowercase", () => {
    const transaction = createTransaction({ currencySymbol: "€" });
    expect(getNormalizedCurrency(transaction)).toBe("€");
  });

  it("returns default currency normalized when not set", () => {
    const transaction = createTransaction({ currencySymbol: undefined });
    expect(getNormalizedCurrency(transaction)).toBe("$");
  });
});

describe("formatAmountFixed", () => {
  it("formats positive amount with 2 decimal places", () => {
    expect(formatAmountFixed(123.456)).toBe("123.46");
  });

  it("formats negative amount as absolute value with 2 decimal places", () => {
    expect(formatAmountFixed(-123.456)).toBe("123.46");
  });

  it("formats zero with 2 decimal places", () => {
    expect(formatAmountFixed(0)).toBe("0.00");
  });

  it("formats whole numbers with 2 decimal places", () => {
    expect(formatAmountFixed(100)).toBe("100.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatAmountFixed(1.999)).toBe("2.00");
  });
});

describe("getTransactionDirection", () => {
  it("returns Income for positive amount", () => {
    expect(getTransactionDirection(100)).toBe("Income");
  });

  it("returns Expense for negative amount", () => {
    expect(getTransactionDirection(-100)).toBe("Expense");
  });

  it("returns Income for zero", () => {
    expect(getTransactionDirection(0)).toBe("Income");
  });
});

describe("getFlowDirection", () => {
  it("returns credit for positive amount", () => {
    expect(getFlowDirection(100)).toBe("credit");
  });

  it("returns debit for negative amount", () => {
    expect(getFlowDirection(-100)).toBe("debit");
  });

  it("returns credit for zero", () => {
    expect(getFlowDirection(0)).toBe("credit");
  });
});

describe("getFlowType", () => {
  it("returns in for positive amount", () => {
    expect(getFlowType(100)).toBe("in");
  });

  it("returns out for negative amount", () => {
    expect(getFlowType(-100)).toBe("out");
  });

  it("returns in for zero", () => {
    expect(getFlowType(0)).toBe("in");
  });
});
