import { z } from "zod";

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().transform(s => s.trim()).optional(),
  department: z.string().transform(s => s.trim()).optional(),
  year: z.coerce.number().int().optional(),
  impactType: z.string().transform(s => s.trim()).optional(),
  tag: z.string().transform(s => s.trim()).optional(),
  featured: z.coerce.boolean().optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
