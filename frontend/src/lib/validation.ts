/**
 * Client-side input checks for fields whose shape is known before a request is
 * sent. Server-side validation remains authoritative.
 */
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_FULL_NAME_LENGTH = 100;

const hasUnsafeCharacters = (value: string) => /[\u0000-\u001F\u007F<>]/.test(value);

export function isValidEmail(value: string): boolean {
  return value.length > 0
    && value.length <= MAX_EMAIL_LENGTH
    && value === value.trim()
    && !hasUnsafeCharacters(value)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Login accepts any server-supported password, subject only to safe transport limits. */
export function isValidLoginPassword(value: string): boolean {
  return value.length > 0 && value.length <= MAX_PASSWORD_LENGTH && !/[\u0000-\u001F\u007F]/.test(value);
}

export function isValidRegistrationPassword(value: string): boolean {
  return isValidLoginPassword(value)
    && value.length >= 12
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

export function isValidFullName(value: string): boolean {
  const normalized = value.trim();
  return normalized.length >= 2
    && normalized.length <= MAX_FULL_NAME_LENGTH
    && normalized === value
    && !hasUnsafeCharacters(value);
}
