import { MAX_CSV_ROWS } from "@shared/constants";
import { transactionSchema, type ParsedTransaction } from "@shared/schema";
import {
  buildSource,
  detectCurrencySymbol,
  firstNonEmpty,
  inferCategory,
  normalizeHeader,
  parseAmount,
  parseDate,
} from "@/normalization/revolut";

const detectDelimiter = (line: string) => {
  const commaCount = (line.match(/,/g) ?? []).length;
  const semicolonCount = (line.match(/;/g) ?? []).length;
  if (semicolonCount > commaCount) {
    return ";";
  }
  if (commaCount > 0) {
    return ",";
  }
  return ",";
};

const tokenizeCsv = (text: string, delimiter: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (insideQuotes) {
      if (char === "\"") {
        if (text[i + 1] === "\"") {
          value += "\"";
          i += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }

    if (char === "\"") {
      insideQuotes = true;
      continue;
    }

    if (char === delimiter) {
      row.push(value);
      value = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (insideQuotes) {
    throw new Error("Malformed CSV: mismatched quotes detected.");
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
};

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const parseRevolutCsv = (text: string): ParsedTransaction[] => {
  const contents = text.replace(/^\uFEFF/, "");
  if (!contents.trim()) {
    return [];
  }

  const firstLine = contents.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows = tokenizeCsv(contents, delimiter);
  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;

  if (dataRows.length > MAX_CSV_ROWS) {
    throw new Error(`CSV exceeds the maximum supported row count of ${MAX_CSV_ROWS}.`);
  }
  const headers = headerRow.map((cell) => cell.trim());
  const headerMap = new Map<string, number>();
  headers.forEach((header, index) => {
    headerMap.set(normalizeHeader(header), index);
  });

  const findColumn = (...candidates: string[]) => {
    for (const candidate of candidates) {
      const key = normalizeHeader(candidate);
      if (headerMap.has(key)) {
        return headerMap.get(key)!;
      }
    }
    return undefined;
  };

  const findColumnByIncludes = (includes: string[], excludes: string[] = []) => {
    for (const entry of Array.from(headerMap.entries())) {
      const [key, index] = entry;
      const matches = includes.every((needle) => key.includes(needle));
      const excluded = excludes.some((needle) => key.includes(needle));
      if (matches && !excluded) {
        return index;
      }
    }
    return undefined;
  };

  const dateIndex =
    findColumn("Completed Date", "Date", "Started Date", "CompletedDate") ??
    findColumnByIncludes(["date"]);
  const descriptionIndex =
    findColumn("Description", "Reference", "Notes", "Label") ??
    findColumnByIncludes(["description"]);
  const typeIndex = findColumn("Type") ?? findColumnByIncludes(["type"]);
  const productIndex = findColumn("Product") ?? findColumnByIncludes(["product"]);
  const counterpartyIndex =
    findColumn(
      "Counterparty",
      "Merchant",
      "Account Name",
      "Beneficiary",
      "Merchant Name",
      "Name"
    ) ?? findColumnByIncludes(["counterparty"]);
  const amountIndex =
    findColumn(
      "Amount",
      "Amount (account currency)",
      "Amount (EUR)",
      "Amount (GBP)",
      "Amount (USD)",
      "Amount In Account Currency"
    ) ?? findColumnByIncludes(["amount"], ["fee", "balance"]);
  const currencyIndex =
    findColumn("Currency", "Currency Code", "Amount Currency", "Account Currency") ??
    findColumnByIncludes(["currency"]);

  if (dateIndex === undefined) {
    throw new Error("Could not find a date column in the provided CSV.");
  }
  if (amountIndex === undefined) {
    throw new Error("Could not find an amount column in the provided CSV.");
  }

  const transactions: ParsedTransaction[] = [];

  dataRows.forEach((cells, rowIndex) => {
    if (cells.every((cell) => !cell || !cell.trim())) {
      return;
    }

    const getValue = (index: number | undefined) =>
      index !== undefined && index < cells.length ? cells[index] : "";

    // Helper to get the best date value with fallbacks
    function getDateValue() {
      // Try main date index
      const mainDate = getValue(dateIndex);
      if (mainDate) return mainDate;
      // Try "starteddate"
      const startedDateIndex = findColumnByIncludes(["starteddate"]) as number;
      const startedDate = getValue(startedDateIndex);
      if (startedDate) return startedDate;
      // Try "startdate"
      const startDateIndex = findColumnByIncludes(["startdate"]) as number;
      const startDate = getValue(startDateIndex);
      if (startDate) return startDate;
      // Fallback to main date index again (may be empty)
      return getValue(dateIndex);
    }

    const dateValue = getDateValue();
    const parsedDate = parseDate(dateValue);
    if (!parsedDate) {
      return;
    }

    const description = firstNonEmpty(
      getValue(descriptionIndex),
      getValue(counterpartyIndex),
      `Transaction ${rowIndex + 1}`
    );

    const typeValue = getValue(typeIndex);
    const productValue = getValue(productIndex);
    const normalizedProduct = productValue.trim().toLowerCase();
    const normalizedType = typeValue.toLowerCase();
    const sourceLabel = firstNonEmpty(getValue(counterpartyIndex), description);

    const amountRaw = getValue(amountIndex);
    const currencyRaw = getValue(currencyIndex);
    const parsedAmount = parseAmount(amountRaw);
    if (Number.isNaN(parsedAmount)) {
      return;
    }

    if (normalizedProduct && normalizedProduct !== "current") {
      if (normalizedType === "transfer" || normalizedType === "interest") {
        return;
      }
    }

    const category = inferCategory(parsedAmount, typeValue, productValue);

    let amount = parsedAmount;
    if (category === "Expense" && amount > 0) {
      amount = -amount;
    }
    if (category === "Income" && amount < 0) {
      amount = Math.abs(amount);
    }

    const source = buildSource(sourceLabel, category, typeValue);

    const currencySymbol = detectCurrencySymbol(currencyRaw, amountRaw);

    const candidate = {
      id: createId(),
      date: parsedDate,
      description,
      amount,
      currencySymbol,
      category,
      broker: source.type === "broker" ? source.name : undefined,
      source,
      isRecurring: false,
    };

    const parsed = transactionSchema.safeParse(candidate);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const reason = issue?.message ?? "Invalid transaction data";
      const rowNumber = rowIndex + 2; // account for header row
      throw new Error(`Row ${rowNumber} failed validation: ${reason}`);
    }

    transactions.push(parsed.data);
  });

  return transactions;
};

export const loadRevolutCsv = async (file: File): Promise<ParsedTransaction[]> => {
  const text = await file.text();
  return parseRevolutCsv(text);
};
