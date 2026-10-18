import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "../src/lib/pricing";

describe("calculateBookingPrice", () => {
  it("charges the regular price for groups under five", () => {
    expect(calculateBookingPrice(8500, 2)).toBe(17000);
  });

  it("applies a 10% discount to groups of five to nine", () => {
    expect(calculateBookingPrice(8500, 5)).toBe(38250);
  });

  it("applies a 15% discount to groups of ten or more", () => {
    expect(calculateBookingPrice(14500, 10)).toBe(123250);
  });

  it("rejects invalid guest counts", () => {
    expect(() => calculateBookingPrice(8500, 0)).toThrow();
  });
});