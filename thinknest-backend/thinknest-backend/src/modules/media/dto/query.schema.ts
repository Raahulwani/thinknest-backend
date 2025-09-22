import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  kind: z.enum(["image", "video", "youtube"]).optional(),
  tag: z.string().trim().optional(),
  event: z.string().trim().optional(),
  q: z.string().trim().optional(),
  from: z.string().trim().optional(),
  to: z.string().trim().optional(),
  featured: z.coerce.boolean().optional(),
  sort: z.enum(["recent", "title_asc"]).optional(),
  publishedOnly: z.coerce.boolean().default(true),
});
