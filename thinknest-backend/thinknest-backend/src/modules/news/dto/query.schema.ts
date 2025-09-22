import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),

  // filters
  q: z.string().trim().optional(),            // search in title/summary/content
  tag: z.string().trim().optional(),
  category: z.string().trim().optional(),
  featured: z.coerce.boolean().optional(),
  from: z.string().datetime().optional(),     // ISO
  to: z.string().datetime().optional(),       // ISO
  publishedOnly: z.coerce.boolean().default(true),

  // sorting
  sort: z.enum(["newest", "oldest"]).default("newest"),
});
