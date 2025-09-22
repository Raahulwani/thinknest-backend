import { z } from "zod";

export const listQuerySchema = z.object({
  // cards / list
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),

  // filters
  status: z.string().trim().optional(),
  category: z.string().trim().optional(),
  year: z.coerce.number().int().optional(),
  businessUnit: z.string().trim().optional(),
  domain: z.string().trim().optional(),
  challenge: z.string().trim().optional(),
  tags: z.string().optional(), // comma list
  search: z.string().trim().optional(),

  // sorting
  sort: z.enum(["recent", "popular", "year_desc", "title_asc"]).optional(),
});
