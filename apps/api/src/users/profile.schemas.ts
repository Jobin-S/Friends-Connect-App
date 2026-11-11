import { HttpStatus } from '@nestjs/common';
import { GENDERS, INTERESTS, MAX_BIO_LENGTH, MAX_INTERESTS, MIN_AGE_YEARS } from '@friends-connect/contracts';
import { z } from 'zod';
import { apiError } from '../common/api-error';

const city = z.string().trim().min(2).max(60);
const gender = z.enum(GENDERS);
const interests = z
  .array(z.enum(INTERESTS))
  .max(MAX_INTERESTS, `pick at most ${MAX_INTERESTS} interests`)
  .transform((list) => [...new Set(list)]);
const bio = z
  .string()
  .trim()
  .max(MAX_BIO_LENGTH)
  .transform((v) => (v === '' ? null : v));

/** A real calendar date (YYYY-MM-DD), not in the future. */
const dateOfBirth = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, 'is not a real date')
  .refine((v) => v <= todayInIndia(), 'cannot be in the future')
  .refine((v) => v >= '1900-01-01', 'is not a plausible date of birth');

export const profileInputSchema = z.object({
  city,
  dateOfBirth,
  gender: gender.optional(),
  interests: interests.optional().default([]),
  bio: bio.optional(),
});
export type ProfileInputParsed = z.infer<typeof profileInputSchema>;

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(60).optional(),
    city: city.optional(),
    gender: gender.nullable().optional(),
    interests: interests.optional(),
    bio: bio.nullable().optional(),
  })
  .strict(); // rejects dateOfBirth (immutable) and unknown fields

/** Today's date in India (IST), as YYYY-MM-DD, so the 18+ rule flips at local midnight. */
export function todayInIndia(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

export function ageOn(dateOfBirth: string, today: string): number {
  const [by, bm, bd] = dateOfBirth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

/** Throws 400 UNDERAGE for anyone younger than MIN_AGE_YEARS. */
export function assertAdult(dateOfBirth: string): void {
  if (ageOn(dateOfBirth, todayInIndia()) < MIN_AGE_YEARS) {
    throw apiError(
      HttpStatus.BAD_REQUEST,
      'UNDERAGE',
      `You must be at least ${MIN_AGE_YEARS} years old to use Friends Connect.`,
    );
  }
}

/** DB value for a YYYY-MM-DD date column. */
export function toDbDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`);
}
