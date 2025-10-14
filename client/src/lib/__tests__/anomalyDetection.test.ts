import { describe, expect, it } from "vitest";
import { median, medianAbsoluteDeviation } from "../anomalyDetection";

describe("median", () => {
  it("returns the middle value for an odd-length array", () => {
    expect(median([5, 1, 9])).toEqual(5);
  });

  it("returns the mean of the two middle values for an even-length array", () => {
    expect(median([2, 8, 4, 6])).toEqual(5);
  });

  it("ignores non-finite values and returns null when none remain", () => {
    expect(median([Number.NaN, Number.POSITIVE_INFINITY])).toBeNull();
  });

  it("returns null for an empty array", () => {
    expect(median([])).toBeNull();
  });
});

describe("medianAbsoluteDeviation", () => {
  it("computes the MAD around the median by default", () => {
    const sample = [10, 12, 14, 16, 18];
    expect(medianAbsoluteDeviation(sample)).toEqual(2);
  });

  it("supports providing an explicit center value", () => {
    const sample = [3, 5, 7, 9];
    expect(medianAbsoluteDeviation(sample, 6)).toEqual(2);
  });

  it("returns null for empty arrays", () => {
    expect(medianAbsoluteDeviation([])).toBeNull();
  });
});
