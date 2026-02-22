import { z } from 'zod';

export const rsvpSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  rsvpStatus: z.enum(['ACCEPTED', 'DECLINED']),
  mealChoice: z.string().optional(),
  allergies: z.string().optional(),
  plusOneName: z.string().optional(),
  plusOneMeal: z.string().optional(),
  songRequest: z.string().optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;

export const guestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  group: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mealChoice: z.string().optional(),
  allergies: z.string().optional(),
  plusOneName: z.string().optional(),
  plusOneMeal: z.string().optional(),
  rsvpStatus: z.enum(['PENDING', 'ACCEPTED', 'DECLINED']).optional(),
});

export type GuestInput = z.infer<typeof guestSchema>;

export const budgetItemSchema = z.object({
  category: z.string().min(1),
  vendor: z.string().optional(),
  description: z.string().optional(),
  estimated: z.number().min(0),
  actual: z.number().min(0).optional(),
  paid: z.number().min(0).optional(),
  dueDate: z.string().optional(),
});

export type BudgetItemInput = z.infer<typeof budgetItemSchema>;

export const vendorSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  contractUrl: z.string().url().optional().or(z.literal('')),
});

export type VendorInput = z.infer<typeof vendorSchema>;

export const tableSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().min(1).max(20),
  x: z.number().optional(),
  y: z.number().optional(),
});

export type TableInput = z.infer<typeof tableSchema>;

export const weddingSettingsSchema = z.object({
  partner1Name: z.string().min(1),
  partner2Name: z.string().min(1),
  date: z.string().optional(),
  venue: z.string().optional(),
  locale: z.enum(['he', 'en']),
  theme: z.string().optional(),
});

export type WeddingSettingsInput = z.infer<typeof weddingSettingsSchema>;

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const faqSchema = z.object({
  questionHe: z.string().min(1),
  answerHe: z.string().min(1),
  questionEn: z.string().optional(),
  answerEn: z.string().optional(),
  order: z.number().optional(),
});

export const messageTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().min(1),
  channel: z.enum(['SMS', 'EMAIL', 'WHATSAPP']),
});
