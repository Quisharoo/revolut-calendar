import { z } from "zod";

import { APP_TIMEZONE, DEFAULT_CURRENCY_SYMBOL } from "./constants";
import { ensureDate, normalizeWhitespace } from "./utils";

const nonEmptyString = z.string().trim().min(1);

const currencySymbolValueSchema = z
  .string()
  .transform((symbol) => symbol.trim())
  .pipe(nonEmptyString);

export const transactionCategorySchema = z.enum(["Income", "Expense"]);
export type TransactionCategory = z.infer<typeof transactionCategorySchema>;

export const transactionSourceTypeSchema = z.enum([
  "broker",
  "merchant",
  "account",
  "platform",
  "unknown",
]);
export type TransactionSourceType = z.infer<typeof transactionSourceTypeSchema>;

export const transactionSourceSchema = z.object({
  name: nonEmptyString,
  type: transactionSourceTypeSchema,
  identifier: nonEmptyString.optional(),
});
export type TransactionSource = z.infer<typeof transactionSourceSchema>;

const currencySymbolSchema = currencySymbolValueSchema.optional();

const baseTransactionSchema = z.object({
  id: nonEmptyString,
  date: z
    .union([z.date(), z.string(), z.number()])
    .transform((value) => ensureDate(value))
    .refine((value) => !Number.isNaN(value.getTime()), {
      message: "Invalid transaction date",
    }),
  description: nonEmptyString,
  amount: z.number().finite(),
  currencySymbol: currencySymbolSchema,
  category: transactionCategorySchema,
  broker: nonEmptyString.optional(),
  source: transactionSourceSchema.optional(),
  isRecurring: z.boolean().default(false),
});

export const transactionSchema = baseTransactionSchema.transform((transaction) => {
  if (transaction.source) {
    return transaction;
  }

  if (transaction.broker) {
    return {
      ...transaction,
      source: {
        name: transaction.broker,
        type: "broker" as const,
      },
    };
  }

  return {
    ...transaction,
    source: {
      name: transaction.description,
      type: "unknown" as const,
    },
  };
});

export type Transaction = z.infer<typeof transactionSchema>;
export type ParsedTransaction = Transaction;

export const transactionArraySchema = transactionSchema.array();

const recurrenceGapSchema = z.object({
  from: z
    .union([z.date(), z.string(), z.number()])
    .transform((value) => ensureDate(value)),
  to: z
    .union([z.date(), z.string(), z.number()])
    .transform((value) => ensureDate(value)),
  days: z.number().int().nonnegative(),
});

const recurrenceAmountDeltaSchema = z.object({
  min: z.number().finite(),
  max: z.number().finite(),
  average: z.number().finite(),
  currencySymbol: currencySymbolValueSchema.default(DEFAULT_CURRENCY_SYMBOL),
});

export const recurringSeriesExplanationSchema = z.object({
  occurrenceIds: z.array(nonEmptyString).min(3),
  occurrenceDates: z
    .array(z.union([z.date(), z.string(), z.number()]).transform((value) => ensureDate(value)))
    .min(3),
  minSpanDays: z.number().int().nonnegative(),
  maxSpanDays: z.number().int().nonnegative(),
  weekdayDriftDays: z.number().int().nonnegative().optional(),
  gaps: z.array(recurrenceGapSchema),
  amountDelta: recurrenceAmountDeltaSchema,
  notes: z.array(nonEmptyString).default([]),
});

export const recurringCadenceSchema = z.enum([
  "monthly",
  "weekly",
  "biweekly",
  "custom",
]);
export type RecurringCadence = z.infer<typeof recurringCadenceSchema>;

export const recurringSeriesSchema = z
  .object({
    id: nonEmptyString,
    key: nonEmptyString,
    cadence: recurringCadenceSchema,
    transactions: transactionArraySchema,
    representative: transactionSchema,
    explanation: recurringSeriesExplanationSchema,
  })
  .refine((value) => value.transactions.length >= 3, {
    message: "Recurring series must contain at least three transactions",
    path: ["transactions"],
  });

export type RecurringSeries = z.infer<typeof recurringSeriesSchema>;

export const recurringSeriesArraySchema = recurringSeriesSchema.array();

export const icsEventSchema = z.object({
  uid: nonEmptyString,
  dtstamp: z
    .union([z.date(), z.string(), z.number()])
    .transform((value) => ensureDate(value)),
  start: z
    .union([z.date(), z.string(), z.number()])
    .transform((value) => ensureDate(value)),
  end: z
    .union([z.date(), z.string(), z.number()])
    .transform((value) => ensureDate(value))
    .optional(),
  timezone: nonEmptyString.default(APP_TIMEZONE),
  summary: nonEmptyString.transform((value) => normalizeWhitespace(value)),
  description: nonEmptyString.transform((value) => normalizeWhitespace(value)),
  rrule: nonEmptyString.optional(),
  location: nonEmptyString.optional(),
  url: z.string().url().optional(),
  categories: z.array(nonEmptyString).default([]),
});

export type IcsEvent = z.infer<typeof icsEventSchema>;
export const icsEventArraySchema = icsEventSchema.array();

export const schema = {
  transactionSchema,
  transactionArraySchema,
  recurringSeriesSchema,
  recurringSeriesArraySchema,
  icsEventSchema,
  icsEventArraySchema,
};
