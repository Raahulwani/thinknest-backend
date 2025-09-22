import { z } from "zod";
export const listQuerySchema = z.object({
  tag: z.string().trim().optional(),
  tags: z.string().optional(),
  year: z.coerce.number().int().optional(),
  yearField: z.enum(["award", "idea"]).default("award"),
  department: z.string().trim().optional(),
  badge: z.string().trim().optional(),
  search: z.string().trim().optional(),
  hasAwards: z.coerce.boolean().optional(),
  sort: z.enum(["name_asc", "name_desc", "awards_desc", "ideas_desc", "recent_award_desc"]).optional(),
  include: z.string().optional(), // ideas,awards,badges,counts,members
  ideasLimit: z.coerce.number().int().positive().max(5).default(1),
  awardsLimit: z.coerce.number().int().positive().max(5).default(3),
  membersLimit: z.coerce.number().int().positive().max(12).default(6),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});
