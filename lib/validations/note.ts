import { z } from "zod";
import { ACCEPTED_FILE_EXTENSIONS, LANGUAGES, SEMESTERS } from "@/lib/constants";

export const noteMetadataSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(160, "Title must be under 160 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must be under 5000 characters"),
  categoryId: z.string().uuid("Select a category"),
  universityName: z.string().trim().max(160).optional().or(z.literal("")),
  courseName: z.string().trim().max(160).optional().or(z.literal("")),
  subjectName: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(160, "Subject must be under 160 characters"),
  college: z.string().trim().max(160).optional().or(z.literal("")),
  board: z.string().trim().max(120).optional().or(z.literal("")),
  semester: z.enum(SEMESTERS).optional().or(z.literal("")),
  department: z.string().trim().max(120).optional().or(z.literal("")),
  language: z.enum(LANGUAGES),
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(99999, "Price is too high"),
  discountPercent: z.coerce
    .number()
    .int()
    .min(0, "Discount cannot be negative")
    .max(90, "Discount cannot exceed 90%")
    .default(0),
  version: z.string().trim().max(40, "Version must be under 40 characters").optional().or(z.literal("")),
  edition: z.string().trim().max(60, "Edition must be under 60 characters").optional().or(z.literal("")),
  visibility: z.enum(["public", "private"]).default("public"),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(8, "Use at most 8 tags")
    .default([]),
  previewPages: z.coerce
    .number()
    .int()
    .min(0, "Preview pages cannot be negative")
    .max(20, "At most 20 preview pages"),
});

export const createNoteSchema = noteMetadataSchema.extend({
  filePath: z.string().min(1, "File upload is required"),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  fileType: z.enum(ACCEPTED_FILE_EXTENSIONS),
  thumbnailPath: z.string().optional().or(z.literal("")),
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(5000),
  price: z.coerce.number().min(0, "Price cannot be negative").max(99999, "Price is too high"),
  discountPercent: z.coerce
    .number()
    .int()
    .min(0, "Discount cannot be negative")
    .max(90, "Discount cannot exceed 90%"),
  version: z.string().trim().max(40).optional().or(z.literal("")),
  edition: z.string().trim().max(60).optional().or(z.literal("")),
  visibility: z.enum(["public", "private"]),
  previewPages: z.coerce.number().int().min(0).max(20),
});

export type NoteMetadataInput = z.infer<typeof noteMetadataSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
