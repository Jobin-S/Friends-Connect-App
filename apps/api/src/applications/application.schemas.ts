import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .url('must be a full link starting with https://')
  .max(300)
  .optional()
  .or(z.literal('').transform(() => undefined));

export const celebrityDetailsSchema = z.object({
  category: z.string().trim().min(2).max(80),
  bio: z.string().trim().min(10).max(1000),
  socialUrl: optionalUrl,
});

export const orgDetailsSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  registrationNo: z.string().trim().min(3).max(40),
  websiteUrl: optionalUrl,
});

export const applyBodySchema = z.discriminatedUnion('requestedRole', [
  z.object({ requestedRole: z.literal('CELEBRITY'), details: celebrityDetailsSchema }),
  z.object({ requestedRole: z.literal('ORG'), details: orgDetailsSchema }),
]);
export type ApplyInput = z.infer<typeof applyBodySchema>;

export const reviewBodySchema = z.object({
  note: z.string().trim().max(500).optional(),
});
