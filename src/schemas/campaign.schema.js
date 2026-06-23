import { z } from 'zod';

// Simple lenient email regex — Zod v4's built-in .email() is too strict
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(200),
  templateId: z.string().min(1, 'Template is required'),
  csvData: z.array(
    z.object({
      company_name: z.string().default(''),
      recruiter_email: z.string().trim().regex(emailRegex, 'Invalid email address'),
      recruiter_name: z.string().default(''),
      job_role: z.string().default(''),
    }).passthrough()
  ).min(1, 'At least one recipient is required'),
  resumeFileName: z.string().optional().default(''),
}).passthrough();

export const startCampaignSchema = z.object({
  email: z.string().trim().regex(emailRegex, 'Valid Gmail address is required'),
  appPassword: z.string().min(1, 'Google App Password is required'),
  senderName: z.string().optional().default(''),
  name: z.string().optional().default(''),
  skills: z.string().optional().default(''),
  portfolio: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  experience: z.string().optional().default(''),
  resumeBase64: z.string().optional(),
  resumeFileName: z.string().optional(),
  scheduledAt: z.string().optional().nullable(),
}).passthrough();
