import type {
  ParsedTransaction,
  TransactionCategory,
  TransactionSource,
  TransactionSourceType,
} from "@shared/schema";
import { DEFAULT_CURRENCY_SYMBOL } from "./transactionUtils";

const NORMALIZE_REGEX = /[^a-z0-9]/g;

const normalizeHeader = (header: string) =>
  header.trim().toLowerCase().replace(NORMALIZE_REGEX, "");

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

const parseAmount = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return NaN;
  }

  const cleaned = trimmed
    .replace(/[\u00a0\s]/g, "")
    .replace(/[^0-9,.-]/g, "");
  if (!cleaned) {
    return NaN;
  }

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalised = cleaned;
  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      normalised = cleaned.replace(/\./g, "").replace(/,/g, ".");
    } else {
      normalised = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalised = cleaned.replace(/,/g, ".");
  }

  return Number.parseFloat(normalised);
};

const parseDate = (raw: string): Date | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const isoCandidate = trimmed.replace(" ", "T");
  const direct = new Date(isoCandidate);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const slashMatch = trimmed.match(
    /^(\d{2})[\/](\d{2})[\/](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (slashMatch) {
    const [, day, month, year, hours = "0", minutes = "0", seconds = "0"] = slashMatch;
    const parsed = new Date(
      Number.parseInt(year, 10),
      Number.parseInt(month, 10) - 1,
      Number.parseInt(day, 10),
      Number.parseInt(hours, 10),
      Number.parseInt(minutes, 10),
      Number.parseInt(seconds, 10)
    );
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const dashMatch = trimmed.match(
    /^(\d{4})[-/](\d{2})[-/](\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (dashMatch) {
    const [, year, month, day, hours = "0", minutes = "0", seconds = "0"] = dashMatch;
    const parsed = new Date(
      Number.parseInt(year, 10),
      Number.parseInt(month, 10) - 1,
      Number.parseInt(day, 10),
      Number.parseInt(hours, 10),
      Number.parseInt(minutes, 10),
      Number.parseInt(seconds, 10)
    );
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const firstNonEmpty = (...values: Array<string | undefined>) =>
  values.find((value) => value && value.trim().length > 0)?.trim() ?? "";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const inferCategory = (
  amount: number,
  typeValue: string,
  productValue: string
): TransactionCategory => {
  const type = typeValue.toLowerCase();
  const product = productValue.toLowerCase();

  if (type.includes("transfer") || type.includes("topup") || product.includes("transfer")) {
    return "Transfer";
  }
  if (type.includes("exchange")) {
    return "Transfer";
  }
  if (type.includes("refund")) {
    return amount >= 0 ? "Income" : "Expense";
  }
  if (type.includes("fee")) {
    return "Expense";
  }

  if (amount >= 0) {
    return "Income";
  }
  if (amount < 0) {
    return "Expense";
  }

  return "Transfer";
};

const inferSourceType = (
  category: TransactionCategory,
  typeValue: string
): TransactionSourceType => {
  const normalised = typeValue.toLowerCase();
  if (category === "Transfer" || normalised.includes("transfer")) {
    return "account";
  }
  if (normalised.includes("broker")) {
    return "broker";
  }
  if (normalised.includes("merchant")) {
    return "merchant";
  }
  if (normalised.includes("salary") || normalised.includes("payroll")) {
    return "broker";
  }
  if (category === "Income") {
    return "broker";
  }
  if (category === "Expense") {
    return "merchant";
  }
  return "unknown";
};

const buildSource = (
  name: string,
  category: TransactionCategory,
  typeValue: string
): TransactionSource => ({
  name,
  type: inferSourceType(category, typeValue),
});

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

    const dateValue = getValue(dateIndex);
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
    const sourceLabel = firstNonEmpty(getValue(counterpartyIndex), description);

    const amountRaw = getValue(amountIndex);
    const currencyRaw = getValue(currencyIndex);
    const parsedAmount = parseAmount(amountRaw);
    if (Number.isNaN(parsedAmount)) {
      return;
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

    transactions.push({
      id: createId(),
      date: parsedDate,
      description,
      amount,
      currencySymbol,
      category,
      broker: source.type === "broker" ? source.name : undefined,
      source,
      isRecurring: false,
    });
  });

  return transactions;
};

export const loadRevolutCsv = async (file: File): Promise<ParsedTransaction[]> => {
  const text = await file.text();
  return parseRevolutCsv(text);
};
const CURRENCY_SYMBOL_BY_CODE: Record<string, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  aud: "A$",
  cad: "C$",
  nzd: "NZ$",
  chf: "CHF",
  jpy: "¥",
  cny: "¥",
  sek: "kr",
  nok: "kr",
  dkk: "kr",
  czk: "Kč",
  pln: "zł",
  huf: "Ft",
  inr: "₹",
  zar: "R",
  brl: "R$",
  hkd: "HK$",
  sgd: "S$",
};

const MULTI_CHAR_SYMBOLS = [
  "A$",
  "C$",
  "NZ$",
  "HK$",
  "S$",
  "R$",
  "kr",
  "Kč",
  "zł",
  "Ft",
];

const SINGLE_CHAR_SYMBOLS = new Set([
  "$",
  "€",
  "£",
  "¥",
  "₹",
  "₽",
  "₺",
  "₿",
  "₩",
  "₪",
  "₫",
  "₴",
  "₦",
  "₵",
  "₲",
  "₱",
  "฿",
  "₡",
  "₭",
  "₨",
  "₸",
  "₮",
  "៛",
]);

const extractCurrencySymbol = (raw: string): string | undefined => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  for (const symbol of MULTI_CHAR_SYMBOLS) {
    if (trimmed.includes(symbol)) {
      return symbol;
    }
  }

  for (const char of trimmed) {
    if (SINGLE_CHAR_SYMBOLS.has(char)) {
      return char;
    }
  }

  const alpha = trimmed.replace(/[^a-z]/gi, "");
  if (alpha.length === 3) {
    const mapped = CURRENCY_SYMBOL_BY_CODE[alpha.toLowerCase()];
    if (mapped) {
      return mapped;
    }
  }

  if (trimmed.length <= 4) {
    return trimmed;
  }

  return undefined;
};

const detectCurrencySymbol = (currencyValue: string, amountValue: string): string => {
  const fromCurrencyColumn = extractCurrencySymbol(currencyValue);
  if (fromCurrencyColumn) {
    return fromCurrencyColumn;
  }

  const fromAmount = extractCurrencySymbol(amountValue);
  if (fromAmount) {
    return fromAmount;
  }

  return DEFAULT_CURRENCY_SYMBOL;
};
