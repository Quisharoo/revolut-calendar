import { z } from "zod";
import { CONTRACT_VERSION } from "./version";

export const TransactionCategorySchema = z.enum(["Income", "Expense"]);
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;

export const TransactionSourceTypeSchema = z.enum([
  "broker",
  "merchant",
  "account",
  "platform",
  "unknown",
]);
export type TransactionSourceType = z.infer<typeof TransactionSourceTypeSchema>;

export const TransactionSourceSchema = z.object({
  name: z.string().min(1),
  type: TransactionSourceTypeSchema,
  identifier: z.string().min(1).optional(),
});
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;

export const TransactionSchema = z
  .object({
    id: z.string().min(1),
    date: z.coerce.date(),
    description: z.string().min(1),
    amount: z.number(),
    currencySymbol: z.string().min(1).default("€"),
    category: TransactionCategorySchema,
    source: TransactionSourceSchema,
    contractVersion: z.literal(CONTRACT_VERSION).default(CONTRACT_VERSION),
    metadata: z.record(z.unknown()).optional(),
    isRecurring: z.boolean().default(false),
  })
  .strict();
export type Transaction = z.infer<typeof TransactionSchema>;
export type ParsedTransaction = Transaction;

export const RecurrenceOccurrenceSchema = z.object({
  id: z.string(),
  date: z.coerce.date(),
  amount: z.number(),
  delta: z.number(),
});

export const RecurrenceGapSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  days: z.number().nonnegative(),
});

export const RecurrenceExplanationSchema = z.object({
  occurrences: z.array(RecurrenceOccurrenceSchema),
  totalSpanDays: z.number().nonnegative(),
  gaps: z.array(RecurrenceGapSchema),
});

export const RecurringSeriesSchema = z.object({
  id: z.string(),
  label: z.string(),
  transactionIds: z.array(z.string().min(1)),
  direction: z.enum(["credit", "debit"]),
  amount: z.number(),
  currencySymbol: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rrule: z.string().min(1),
  explanation: RecurrenceExplanationSchema,
});
export type RecurringSeries = z.infer<typeof RecurringSeriesSchema>;

export const IcsEventSchema = z.object({
  uid: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  start: z.coerce.date(),
  end: z.coerce.date(),
  rrule: z.string().min(1),
  timezone: z.string().min(1),
});
export type IcsEvent = z.infer<typeof IcsEventSchema>;
