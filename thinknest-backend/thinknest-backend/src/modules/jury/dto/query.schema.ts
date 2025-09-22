import { z } from 'zod';

export const listQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  years: z.string().optional(), // comma list
  search: z.string().trim().min(1).optional(),
  department: z.string().trim().optional(),
  expertise: z.string().trim().optional(),
  role: z.enum(['chair', 'co-chair', 'member', 'advisor']).optional(),
  sort: z.enum([
    'name_asc','name_desc',
    'role_asc','role_desc',
    'department_asc','department_desc'
  ]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  groupBy: z.enum(['year']).optional(),
});
