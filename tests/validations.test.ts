import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { confirmPaymentSchema, createOrderSchema } from "@/lib/validations/order";
import { updateNoteSchema } from "@/lib/validations/note";
import { createReportSchema, createReviewSchema } from "@/lib/validations/review";

describe("registerSchema", () => {
  const valid = {
    fullName: "Priya Sharma",
    username: "priya_sharma",
    email: "priya@example.com",
    password: "supersecret1",
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects usernames with invalid characters", () => {
    expect(registerSchema.safeParse({ ...valid, username: "Priya Sharma" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
  });

  it("rejects short passwords", () => {
    expect(registerSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a valid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});

describe("createOrderSchema", () => {
  it("requires a UUID note id", () => {
    expect(createOrderSchema.safeParse({ noteId: "abc" }).success).toBe(false);
    expect(
      createOrderSchema.safeParse({ noteId: "6f1e1c2a-8f4b-4f36-9a1d-2b7c9d8e5f01" }).success
    ).toBe(true);
  });
});

describe("confirmPaymentSchema", () => {
  const valid = {
    cardNumber: "4242 4242 4242 4242",
    cardHolder: "Priya Sharma",
    expiry: "12/29",
    cvc: "123",
    acceptedTerms: true,
  };

  it("accepts valid sandbox card details", () => {
    expect(confirmPaymentSchema.safeParse(valid).success).toBe(true);
  });

  it("requires accepted terms", () => {
    expect(confirmPaymentSchema.safeParse({ ...valid, acceptedTerms: false }).success).toBe(false);
  });

  it("rejects malformed expiry dates", () => {
    expect(confirmPaymentSchema.safeParse({ ...valid, expiry: "13/29" }).success).toBe(false);
  });
});

describe("updateNoteSchema", () => {
  const valid = {
    title: "DBMS complete notes",
    description: "Covers all five units with solved previous year questions.",
    price: 99,
    discountPercent: 10,
    version: "v2",
    edition: "",
    visibility: "public",
    previewPages: 3,
  };

  it("accepts a valid update", () => {
    expect(updateNoteSchema.safeParse(valid).success).toBe(true);
  });

  it("caps discounts at 90 percent", () => {
    expect(updateNoteSchema.safeParse({ ...valid, discountPercent: 95 }).success).toBe(false);
  });
});

describe("review and report schemas", () => {
  it("requires a rating between 1 and 5", () => {
    expect(createReviewSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(createReviewSchema.safeParse({ rating: 5 }).success).toBe(true);
  });

  it("only accepts known report reasons", () => {
    expect(createReportSchema.safeParse({ reason: "copyright" }).success).toBe(true);
    expect(createReportSchema.safeParse({ reason: "dislike" }).success).toBe(false);
  });
});
