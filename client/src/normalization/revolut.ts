import { DEFAULT_CURRENCY_SYMBOL } from "@shared/constants";
import type {
  TransactionCategory,
  TransactionSource,
  TransactionSourceType,
} from "@shared/schema";

const NORMALIZE_REGEX = /[^a-z0-9]/g;

export const normalizeHeader = (header: string) =>
  header.trim().toLowerCase().replace(NORMALIZE_REGEX, "");

export const parseAmount = (raw: string) => {
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

export const parseDate = (raw: string): Date | null => {
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

export const firstNonEmpty = (...values: Array<string | undefined>) =>
  values.find((value) => value && value.trim().length > 0)?.trim() ?? "";

export const inferCategory = (
  amount: number,
  typeValue: string,
  productValue: string
): TransactionCategory => {
  const type = typeValue.toLowerCase();
  const product = productValue.toLowerCase();

  if (type.includes("refund") || product.includes("refund")) {
    return amount >= 0 ? "Income" : "Expense";
  }
  if (type.includes("fee") || product.includes("fee")) {
    return "Expense";
  }

  if (amount > 0) {
    return "Income";
  }
  if (amount < 0) {
    return "Expense";
  }

  return "Income";
};

export const inferSourceType = (
  category: TransactionCategory,
  typeValue: string
): TransactionSourceType => {
  const normalised = typeValue.toLowerCase();
  if (
    normalised.includes("transfer") ||
    normalised.includes("topup") ||
    normalised.includes("exchange")
  ) {
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

export const buildSource = (
  name: string,
  category: TransactionCategory,
  typeValue: string
): TransactionSource => ({
  name,
  type: inferSourceType(category, typeValue),
});

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

export const detectCurrencySymbol = (
  currencyValue: string,
  amountValue: string
): string => {
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
