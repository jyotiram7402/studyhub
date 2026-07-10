import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-under-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
    }
  });

  it("blocks requests over the limit and reports retry timing", () => {
    const key = `test-over-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000);
    }
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const first = `test-a-${Date.now()}`;
    const second = `test-b-${Date.now()}`;
    checkRateLimit(first, 1, 60_000);
    expect(checkRateLimit(first, 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit(second, 1, 60_000).allowed).toBe(true);
  });
});
