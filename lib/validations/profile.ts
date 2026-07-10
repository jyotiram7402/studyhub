import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters"),
  bio: z.string().trim().max(500, "Bio must be under 500 characters").optional().or(z.literal("")),
  college: z.string().trim().max(120).optional().or(z.literal("")),
  course: z.string().trim().max(120).optional().or(z.literal("")),
  semester: z.string().trim().max(40).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
