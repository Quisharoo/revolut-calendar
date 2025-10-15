import { describe, expect, it } from "vitest";
import {
  normalizeTextForKey,
  normalizeHeader,
  toSlug,
  hashString,
} from "../stringUtils";

describe("normalizeTextForKey", () => {
  it("converts to lowercase and normalizes whitespace", () => {
    expect(normalizeTextForKey("Netflix  Subscription!")).toBe("netflix subscription");
  });

  it("removes special characters but keeps spaces", () => {
    expect(normalizeTextForKey("Hello-World! @#$% Test")).toBe("hello world test");
  });

  it("collapses multiple spaces into one", () => {
    expect(normalizeTextForKey("too    many     spaces")).toBe("too many spaces");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeTextForKey("  trimmed  ")).toBe("trimmed");
  });

  it("handles empty strings", () => {
    expect(normalizeTextForKey("")).toBe("");
  });

  it("preserves alphanumeric characters", () => {
    expect(normalizeTextForKey("Test123")).toBe("test123");
  });
});

describe("normalizeHeader", () => {
  it("removes all non-alphanumeric characters", () => {
    expect(normalizeHeader("Amount (EUR)")).toBe("amounteur");
  });

  it("converts to lowercase", () => {
    expect(normalizeHeader("COMPLETED DATE")).toBe("completeddate");
  });

  it("removes spaces", () => {
    expect(normalizeHeader("Currency Code")).toBe("currencycode");
  });

  it("handles special characters", () => {
    expect(normalizeHeader("Amount-In-EUR")).toBe("amountineur");
  });

  it("handles empty strings", () => {
    expect(normalizeHeader("")).toBe("");
  });
});

describe("toSlug", () => {
  it("converts text to URL-friendly slug", () => {
    expect(toSlug("My Transaction Name")).toBe("my-transaction-name");
  });

  it("replaces multiple non-alphanumeric characters with single hyphen", () => {
    expect(toSlug("Hello!!!World")).toBe("hello-world");
  });

  it("removes leading and trailing hyphens", () => {
    expect(toSlug("-trimmed-")).toBe("trimmed");
  });

  it("collapses consecutive hyphens", () => {
    expect(toSlug("too---many---hyphens")).toBe("too-many-hyphens");
  });

  it("handles empty strings", () => {
    expect(toSlug("")).toBe("");
  });

  it("preserves alphanumeric characters", () => {
    expect(toSlug("test123")).toBe("test123");
  });
});

describe("hashString", () => {
  it("generates consistent hash for same input", () => {
    const input = "test string";
    const hash1 = hashString(input);
    const hash2 = hashString(input);
    expect(hash1).toBe(hash2);
  });

  it("generates different hashes for different inputs", () => {
    const hash1 = hashString("test1");
    const hash2 = hashString("test2");
    expect(hash1).not.toBe(hash2);
  });

  it("returns base-36 string", () => {
    const hash = hashString("test");
    expect(hash).toMatch(/^[0-9a-z]+$/);
  });

  it("handles empty strings", () => {
    const hash = hashString("");
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe("string");
  });

  it("handles long strings", () => {
    const longString = "a".repeat(1000);
    const hash = hashString(longString);
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe("string");
  });
});
