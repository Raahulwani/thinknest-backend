import { z } from "zod";

export const upsertNewsSchema = z.object({
  slug: z.string().min(3).max(160),
  title: z.string().min(3).max(180),
  summary: z.string().min(3).max(280),
  content: z.string().min(1),
  publishedAt: z.string().datetime().nullable().optional(), // null = draft
  category: z.string().max(80).nullable().optional(),
  coverKind: z.enum(["image", "video"]).nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string().min(1)).optional(), // tag names
});
