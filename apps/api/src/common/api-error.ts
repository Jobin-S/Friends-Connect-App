import { HttpException, HttpStatus } from '@nestjs/common';
import type { AuthErrorCode } from '@friends-connect/contracts';

/** Throw an HTTP error whose body carries a stable `code` that clients can branch on. */
export function apiError(status: HttpStatus, code: AuthErrorCode, message: string): HttpException {
  return new HttpException({ statusCode: status, message, code }, status);
}
