// Single source of truth for values every client must agree on.
// Keep this file free of runtime dependencies so it can be used anywhere.

export const USER_ROLES = ['NORMAL', 'CELEBRITY', 'ORG', 'SUPPORT', 'SUPER_ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CALL_TYPES = [
  'RANDOM_AUDIO',
  'RANDOM_VIDEO',
  'CELEB_AUDIO',
  'CELEB_VIDEO',
  'SUPPORT_AUDIO',
] as const;
export type CallType = (typeof CALL_TYPES)[number];

/** Video is only ever allowed on random and celebrity video calls. Support calls are audio-only. */
export function isVideoAllowed(callType: CallType): boolean {
  return callType === 'RANDOM_VIDEO' || callType === 'CELEB_VIDEO';
}

/** Celebrity calls are the only paid calls. */
export function isPaidCall(callType: CallType): boolean {
  return callType === 'CELEB_AUDIO' || callType === 'CELEB_VIDEO';
}

// ---------------------------------------------------------------------------
// Auth & registration
// ---------------------------------------------------------------------------

/** What a person can choose when registering. SUPPORT and SUPER_ADMIN are never self-registered. */
export const ACCOUNT_TYPES = ['NORMAL', 'CELEBRITY', 'ORG'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type ApplicationRole = 'CELEBRITY' | 'ORG';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'RESTRICTED' | 'SUSPENDED';

export interface CelebrityApplicationDetails {
  category: string;
  bio: string;
  socialUrl?: string;
}

export interface OrgApplicationDetails {
  companyName: string;
  registrationNo: string;
  websiteUrl?: string;
}

export interface RoleApplicationDto {
  id: string;
  requestedRole: ApplicationRole;
  status: ApplicationStatus;
  details: CelebrityApplicationDetails | OrgApplicationDetails;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface UserDto {
  id: string;
  phoneNumber: string;
  displayName: string;
  role: UserRole;
  status: AccountStatus;
  /** Latest celebrity/organizer application, if any (pending, or most recently reviewed). */
  latestApplication: RoleApplicationDto | null;
}

export interface OtpRequestBody {
  phone: string;
}
export interface OtpRequestResponse {
  phone: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
}

export interface OtpVerifyBody {
  phone: string;
  code: string;
}

/** Mobile clients send `X-Client: mobile` and receive `refreshToken` in the body; web gets an httpOnly cookie. */
export interface LoggedInResponse {
  status: 'LOGGED_IN';
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken?: string;
  user: UserDto;
}
export interface NeedsRegistrationResponse {
  status: 'NEEDS_REGISTRATION';
  phone: string;
  registrationToken: string;
}
export type OtpVerifyResponse = LoggedInResponse | NeedsRegistrationResponse;

export type RegisterBody =
  | { registrationToken: string; displayName: string; accountType: 'NORMAL' }
  | {
      registrationToken: string;
      displayName: string;
      accountType: 'CELEBRITY';
      application: CelebrityApplicationDetails;
    }
  | {
      registrationToken: string;
      displayName: string;
      accountType: 'ORG';
      application: OrgApplicationDetails;
    };

export type ApplyBody =
  | { requestedRole: 'CELEBRITY'; details: CelebrityApplicationDetails }
  | { requestedRole: 'ORG'; details: OrgApplicationDetails };

export interface AdminApplicationDto extends RoleApplicationDto {
  user: { id: string; phoneNumber: string; displayName: string };
}

/** API errors carry `{ statusCode, message, code? }`; these are the stable codes clients can branch on. */
export const AUTH_ERROR_CODES = {
  INVALID_PHONE: 'INVALID_PHONE',
  OTP_RATE_LIMITED: 'OTP_RATE_LIMITED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_TOO_MANY_ATTEMPTS: 'OTP_TOO_MANY_ATTEMPTS',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  REGISTRATION_TOKEN_INVALID: 'REGISTRATION_TOKEN_INVALID',
  APPLICATION_ALREADY_PENDING: 'APPLICATION_ALREADY_PENDING',
  SESSION_INVALID: 'SESSION_INVALID',
} as const;
export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
