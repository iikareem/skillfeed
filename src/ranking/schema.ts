import { z } from "zod";

const text = z.string().trim().min(1);

export const userProfileSchema = z.object({
  summary: text.min(8, "Add a short summary of your skills"),
  avoid: z.string().trim().optional(),
});

const sourceIdSchema = z.enum([
  "hacker-news",
  "devto",
  "hashnode",
  "lobsters",
]);

export const rankRequestSchema = z.object({
  profile: userProfileSchema,
  perSource: z.number().int().min(1).max(50).optional(),
  maxArticles: z.number().int().min(1).max(100).optional(),
  batchSize: z.number().int().min(1).max(20).optional(),
  sources: z.array(sourceIdSchema).min(1).optional(),
});

export type RankRequestBody = z.infer<typeof rankRequestSchema>;
