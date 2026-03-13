const DIGITS_ONLY_REGEX = /\D/g;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM_REGEX = /^[A-Za-z0-9._]{1,30}$/;
const INSTAGRAM_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})/i;

export function digitsOnly(value: string): string {
  return value.replace(DIGITS_ONLY_REGEX, "");
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeEmail(value: string): string {
  return value.replace(/\s/g, "").toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  return normalized.length === 0 || EMAIL_REGEX.test(normalized);
}

export function formatInstagram(value: string): string {
  const trimmed = value.trim();
  const urlHandle = trimmed.match(INSTAGRAM_URL_REGEX)?.[1] ?? trimmed;

  return urlHandle
    .replace(/\s/g, "")
    .replace(/^@+/, "")
    .replace(/[/?#].*$/, "")
    .replace(/[^A-Za-z0-9._]/g, "")
    .slice(0, 30)
    .toLowerCase();
}

export function normalizeInstagram(value: string): string {
  return formatInstagram(value);
}

export function formatInstagramDisplay(value: string): string {
  const handle = normalizeInstagram(value);
  return handle ? `@${handle}` : "";
}

export function isValidInstagram(value: string): boolean {
  return value.length === 0 || INSTAGRAM_REGEX.test(normalizeInstagram(value));
}
