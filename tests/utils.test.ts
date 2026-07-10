import { describe, expect, it } from "vitest";
import { finalPrice, formatBytes, formatCount, getInitials, slugify } from "@/lib/utils";

describe("formatBytes", () => {
  it("formats zero bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats kilobytes and megabytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(50 * 1024 * 1024)).toBe("50.0 MB");
  });
});

describe("formatCount", () => {
  it("keeps small numbers as-is", () => {
    expect(formatCount(999)).toBe("999");
  });

  it("abbreviates thousands and millions", () => {
    expect(formatCount(1500)).toBe("1.5k");
    expect(formatCount(2_000_000)).toBe("2.0M");
  });
});

describe("finalPrice", () => {
  it("returns the price when there is no discount", () => {
    expect(finalPrice(100, 0)).toBe(100);
  });

  it("applies percentage discounts with rounding", () => {
    expect(finalPrice(100, 25)).toBe(75);
    expect(finalPrice(99.99, 10)).toBe(89.99);
  });

  it("never goes negative", () => {
    expect(finalPrice(0, 50)).toBe(0);
  });
});

describe("getInitials", () => {
  it("uses the first letters of the first two words", () => {
    expect(getInitials("Priya Sharma")).toBe("PS");
    expect(getInitials("Arjun")).toBe("A");
    expect(getInitials("A B C")).toBe("AB");
  });
});

describe("slugify", () => {
  it("lowercases, trims, and replaces spaces", () => {
    expect(slugify("  Question Papers ")).toBe("question-papers");
  });

  it("strips unsafe characters", () => {
    expect(slugify("DBMS (Unit 3) — Notes!")).toBe("dbms-unit-3-notes");
  });
});
