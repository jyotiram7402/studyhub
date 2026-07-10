import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a star rating").max(5),
  title: z.string().trim().max(80, "Title must be under 80 characters").optional().or(z.literal("")),
  body: z
    .string()
    .trim()
    .max(2000, "Review must be under 2000 characters")
    .optional()
    .or(z.literal("")),
});

export const createReportSchema = z.object({
  reason: z.enum([
    "spam",
    "wrong_content",
    "duplicate",
    "copyright",
    "abusive",
    "broken_file",
    "other",
  ]),
  details: z
    .string()
    .trim()
    .max(1000, "Details must be under 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
