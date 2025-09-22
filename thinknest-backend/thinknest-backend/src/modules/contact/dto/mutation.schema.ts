import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  subject: z.string().min(2).max(160),
  message: z.string().min(5).max(5000),
  type: z.enum(['General', 'Partnership', 'Feedback']),
  // For spam protection (optional; see middleware)
  recaptchaToken: z.string().min(1).optional(),
  // Honeypot (must be empty); frontend should include a hidden input named e.g. hp_field
  hp_field: z.string().max(0).optional(),
});
