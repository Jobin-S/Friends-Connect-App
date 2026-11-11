import { HttpStatus } from '@nestjs/common';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { apiError } from '../common/api-error';

/** Normalize user-typed phone numbers ("98765 43210", "+91-98765-43210") to E.164 ("+919876543210"). */
export function normalizePhone(raw: string, defaultRegion: string): string {
  const parsed = parsePhoneNumberFromString(String(raw ?? '').trim(), defaultRegion as CountryCode);
  if (!parsed || !parsed.isValid()) {
    throw apiError(HttpStatus.BAD_REQUEST, 'INVALID_PHONE', 'Enter a valid mobile number.');
  }
  return parsed.number;
}
