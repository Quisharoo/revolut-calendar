import { describe, expect, it } from "vitest";
import { parseRevolutCsv } from "../revolutParser";

const baseHeader = "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance";

describe("parseRevolutCsv current account focus", () => {
  it("drops savings deposit legs so transfers appear once", () => {
    const csv = [
      baseHeader,
      "Transfer,Deposit,2025-01-24 06:27:18,2025-01-24 06:27:18,To Instant Access Savings,275.00,0.00,EUR,COMPLETED,1000.00",
      "Transfer,Current,2025-01-24 06:27:18,2025-01-24 06:27:18,To Instant Access Savings,-275.00,0.00,EUR,COMPLETED,725.00",
      "Transfer,Deposit,2025-01-25 12:01:01,2025-01-25 12:01:01,From Instant Access Savings,-125.00,0.00,EUR,COMPLETED,9875.00",
      "Transfer,Current,2025-01-25 12:01:01,2025-01-25 12:01:01,From Instant Access Savings,125.00,0.00,EUR,COMPLETED,850.00",
      "Card Payment,Current,2025-01-25 15:00:00,2025-01-26 10:00:00,Coffee Shop,-4.50,0.00,EUR,COMPLETED,845.50",
    ].join("\n");

    const result = parseRevolutCsv(csv);

    expect(result).toHaveLength(3);

    const expense = result.find((tx) => tx.description === "To Instant Access Savings");
    expect(expense?.amount).toBe(-275);
    expect(expense?.category).toBe("Expense");

    const income = result.find((tx) => tx.description === "From Instant Access Savings");
    expect(income?.amount).toBe(125);
    expect(income?.category).toBe("Income");

    const descriptions = result.map((tx) => tx.description);
    expect(descriptions.filter((desc) => desc === "To Instant Access Savings")).toHaveLength(1);
    expect(result.find((tx) => tx.amount === 275)).toBeUndefined();

    const coffee = result.find((tx) => tx.description === "Coffee Shop");
    expect(coffee?.amount).toBeLessThan(0);
  });
});
