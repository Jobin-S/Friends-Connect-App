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
