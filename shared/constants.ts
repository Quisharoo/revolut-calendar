export const TOLERANCE_BANDS = [
  { maxAmount: 50, type: "absolute", value: 0.5 },
  { maxAmount: 500, type: "ratio", value: 0.01 },
] as const;

export const HIGH_AMOUNT_TOLERANCE_RATIO = 0.005;

export const MIN_OCCURRENCES_FOR_SERIES = 3;
export const MIN_SERIES_SPAN_DAYS = 90;

export const DEFAULT_TIMEZONE = "Europe/Dublin";
export const ICS_LINE_LENGTH_LIMIT = 75;

export const CONTRACT_SOURCE = "transaction-calendar";
