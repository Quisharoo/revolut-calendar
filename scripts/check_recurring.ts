import fs from "fs";
import path from "path";
import { parseRevolutCsv } from "../client/src/lib/revolutParser";

const csvPath = path.resolve(".csvfiles/account-statement_2024-01-01_2025-10-09_en-ie_58acb4.csv");
const text = fs.readFileSync(csvPath, "utf8");

const transactions = parseRevolutCsv(text);

const summarize = (label: string) => {
  const matches = transactions.filter((t) => (t.source?.name ?? t.description).toLowerCase().includes(label.toLowerCase()));
  console.log(`\n=== ${label} (${matches.length}) ===`);
  matches.forEach((t) => {
    console.log([
      t.date.toISOString(),
      t.description,
      t.source?.name ?? "",
      t.amount,
      `isRecurring=${t.isRecurring}`,
      `id=${t.id}`,
    ].join("\t"));
  });
};

console.log(`Total parsed transactions: ${transactions.length}`);
summarize("OpenAI");
summarize("Royal London");

// Also list unique recurring groups (by normalized label + direction)
const recurring = transactions.filter((t) => t.isRecurring);
const groupMap = new Map<string, number>();
recurring.forEach((t) => {
  const label = (t.source?.name ?? t.description).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const dir = t.amount >= 0 ? "in" : "out";
  const key = `${label}|${dir}`;
  groupMap.set(key, (groupMap.get(key) ?? 0) + 1);
});

console.log(`\nRecurring groups detected: ${groupMap.size}`);
for (const [k, v] of groupMap.entries()) {
  console.log(`${k} -> ${v}`);
}
