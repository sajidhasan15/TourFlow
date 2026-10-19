import { describe, expect, it } from "vitest";
import { calculateBookingPrice } from "../src/lib/pricing";

describe("calculateBookingPrice", () => {
  it("charges the regular price for one traveler", () => {
    expect(calculateBookingPrice(1000, 1)).toBe(1000);
  });

  it("does not discount groups of three", () => {
    expect(calculateBookingPrice(1000, 3)).toBe(3000);
  });

  it("applies 10% discount starting at four travelers", () => {
    expect(calculateBookingPrice(1000, 4)).toBe(3600);
  });

  it("rejects zero travelers", () => {
    expect(() => calculateBookingPrice(1000, 0)).toThrow();
  });

  it("rejects invalid prices", () => {
    expect(() => calculateBookingPrice(-100, 2)).toThrow();
  });
});