import { z } from "zod";

export const upsertMediaSchema = z.object({
  kind: z.enum(["image", "video", "youtube"]),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  provider: z.string().nullable().optional(),
  providerId: z.string().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  format: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  event: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  blurhash: z.string().nullable().optional(),
  meta: z.record(z.any()).nullable().optional(),
});

export const upsertStorySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  thumbnailId: z.string().uuid().nullable().optional(),
  galleryIds: z.array(z.string().uuid()).default([]),
});
