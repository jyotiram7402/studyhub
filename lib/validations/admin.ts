import { z } from "zod";

export const userActionSchema = z.object({
  action: z.enum(["suspend", "activate"]),
});

export const verificationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const reportReviewSchema = z.object({
  action: z.enum(["resolve", "dismiss"]),
  contentAction: z.enum(["none", "hide", "remove"]).default("none"),
  resolutionNote: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const taxonomyItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  slug: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const platformSettingsSchema = z.object({
  platformName: z.string().trim().min(2).max(60),
  logoUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  commissionPercent: z.coerce.number().min(0).max(50),
  maxUploadSizeMb: z.coerce.number().int().min(1).max(50),
  allowedFileTypes: z.array(z.string().trim().min(1)).min(1, "Allow at least one file type"),
  maintenanceMode: z.boolean(),
});

export const requestVerificationSchema = z.object({
  message: z
    .string()
    .trim()
    .min(20, "Tell us at least a sentence or two")
    .max(1000, "Message must be under 1000 characters"),
});

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
