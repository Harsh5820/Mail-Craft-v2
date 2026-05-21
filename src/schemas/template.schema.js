import { z } from 'zod';

export const createTemplateSchema = z.object({
  // Placeholders supported: user_name, skills, experience, linkedin, github, portfolio, phone, contact_number, contact_number_1, contact_number_2, location, headline, and any CSV fields
  name: z.string().min(1, 'Template name is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(500),
  html: z.string().min(1, 'Email body is required'),
});

export const updateTemplateSchema = z.object({
  // Placeholders supported: user_name, skills, experience, linkedin, github, portfolio, phone, contact_number, contact_number_1, contact_number_2, location, headline, and any CSV fields
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(500).optional(),
  html: z.string().min(1).optional(),
});
