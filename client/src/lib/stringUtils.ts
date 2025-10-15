/**
 * Shared string manipulation utilities to reduce code duplication
 * across transaction parsing and formatting modules.
 */

/**
 * Normalizes text for use as a grouping key or identifier.
 * Converts to lowercase, removes special characters, normalizes whitespace.
 * Used for comparing transaction descriptions and source names.
 * 
 * @param value - The text to normalize
 * @returns Normalized text suitable for comparison and grouping
 * 
 * @example
 * normalizeTextForKey("Netflix  Subscription!") // "netflix subscription"
 */
export const normalizeTextForKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/**
 * Normalizes a header name for CSV column matching.
 * Strips all non-alphanumeric characters and converts to lowercase.
 * More aggressive than normalizeTextForKey to handle various CSV formats.
 * 
 * @param header - The header text to normalize
 * @returns Normalized header with only lowercase letters and numbers
 * 
 * @example
 * normalizeHeader("Amount (EUR)") // "amounteur"
 */
export const normalizeHeader = (header: string): string =>
  header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Converts a string to a URL-friendly slug.
 * Replaces non-alphanumeric characters with hyphens.
 * 
 * @param value - The text to convert to a slug
 * @returns A URL-friendly slug
 * 
 * @example
 * toSlug("My Transaction Name") // "my-transaction-name"
 */
export const toSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Generates a deterministic hash from a string using FNV-1a algorithm.
 * Returns the hash as a base-36 string.
 * 
 * @param value - The string to hash
 * @returns A base-36 hash string
 */
export const hashString = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};
