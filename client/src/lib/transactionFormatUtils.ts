import type { ParsedTransaction } from "@shared/schema";
import { DEFAULT_CURRENCY_SYMBOL } from "./transactionUtils";

/**
 * Shared transaction formatting utilities to reduce code duplication
 * across transaction processing modules.
 */

/**
 * Gets the normalized currency symbol from a transaction, with fallback to default.
 * 
 * @param transaction - The transaction to get currency from
 * @returns The currency symbol, or DEFAULT_CURRENCY_SYMBOL if not set
 */
export const getTransactionCurrency = (transaction: ParsedTransaction): string =>
  transaction.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL;

/**
 * Gets the normalized currency symbol in lowercase for use in keys/identifiers.
 * 
 * @param transaction - The transaction to get currency from
 * @returns The lowercase currency symbol with trimmed whitespace
 */
export const getNormalizedCurrency = (transaction: ParsedTransaction): string =>
  getTransactionCurrency(transaction).trim().toLowerCase();

/**
 * Formats a transaction amount as a fixed decimal string (2 decimal places).
 * Returns the absolute value.
 * 
 * @param amount - The amount to format
 * @returns The absolute amount as a string with 2 decimal places
 */
export const formatAmountFixed = (amount: number): string =>
  Math.abs(amount).toFixed(2);

/**
 * Determines the transaction direction as "Income" or "Expense".
 * 
 * @param amount - The transaction amount
 * @returns "Income" for non-negative amounts, "Expense" for negative amounts
 */
export const getTransactionDirection = (amount: number): "Income" | "Expense" =>
  amount >= 0 ? "Income" : "Expense";

/**
 * Determines the transaction flow direction as "credit" or "debit".
 * 
 * @param amount - The transaction amount
 * @returns "credit" for non-negative amounts, "debit" for negative amounts
 */
export const getFlowDirection = (amount: number): "credit" | "debit" =>
  amount >= 0 ? "credit" : "debit";

/**
 * Determines the transaction flow as "in" or "out".
 * 
 * @param amount - The transaction amount
 * @returns "in" for non-negative amounts, "out" for negative amounts
 */
export const getFlowType = (amount: number): "in" | "out" =>
  amount >= 0 ? "in" : "out";
