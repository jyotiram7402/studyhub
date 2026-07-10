import { z } from "zod";

export const createOrderSchema = z.object({
  noteId: z.string().uuid("Invalid note id"),
});

export const confirmPaymentSchema = z.object({
  cardNumber: z
    .string()
    .trim()
    .regex(/^[\d\s]{16,19}$/, "Enter a valid 16-digit card number"),
  cardHolder: z.string().trim().min(2, "Enter the name on the card").max(80),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/, "Use MM/YY format"),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "Enter a valid CVC"),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms to continue" }),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
