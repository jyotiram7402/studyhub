import { z } from "zod";

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, "Ask a question").max(2000, "Keep questions under 2000 characters"),
  sessionId: z.string().uuid().optional(),
  noteId: z.string().uuid().optional(),
});

export const explainSchema = z.object({
  mode: z.enum(["standard", "beginner", "examples", "simple_english"]),
});

export const quizRequestSchema = z.object({
  types: z
    .array(z.enum(["mcq", "short_answer", "long_answer", "true_false", "fill_blank"]))
    .min(1, "Pick at least one question type")
    .max(5),
  count: z.coerce.number().int().min(3).max(20).default(10),
});

export const flashcardRequestSchema = z.object({
  count: z.coerce.number().int().min(5).max(30).default(12),
});

export const revisionRequestSchema = z.object({
  mode: z.enum(["one_minute", "five_minute", "exam", "night_before"]),
});

export const searchLogSchema = z.object({
  q: z.string().trim().min(1).max(200),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
