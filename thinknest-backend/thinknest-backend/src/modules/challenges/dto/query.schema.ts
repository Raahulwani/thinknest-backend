import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),

  // filters
  status: z.enum(["Open", "Closed", "Judging", "Results"]).optional(),
  category: z.string().trim().optional(),
  participationType: z.enum(["Individual", "Team", "Both"]).optional(),
  deadlineBefore: z.string().datetime().optional(), // ISO date or date-only acceptable
  deadlineAfter: z.string().datetime().optional(),
  search: z.string().trim().optional(),

  // sorting
  // - deadline_asc: nearest upcoming submission first
  // - deadline_desc: farthest deadline first
  // - recent: most recently created
  sort: z.enum(["deadline_asc", "deadline_desc", "recent"]).optional(),
});
