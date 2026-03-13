const DIGITS_ONLY_REGEX = /\D/g;
const INSTAGRAM_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})/i;

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizePhone(value: string): string {
  return value.replace(DIGITS_ONLY_REGEX, "").slice(0, 11);
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value);

  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function normalizeCpf(value: string): string {
  return value.replace(DIGITS_ONLY_REGEX, "").slice(0, 11);
}

export function normalizeEmail(value: string): string {
  return value.replace(/\s/g, "").toLowerCase();
}

export function normalizeInstagram(value: string): string {
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

export function toOptionalString(value?: string | null): string | undefined {
  if (value == null) return undefined;

  const normalized = normalizeWhitespace(value);
  return normalized || undefined;
}

export function toNullableString(
  value?: string | null,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = normalizeWhitespace(value);
  return normalized || null;
}

export function buildPhoneSearchTerms(value: string): string[] {
  const terms = new Set<string>();
  const trimmed = value.trim();

  if (trimmed) {
    terms.add(trimmed);
  }

  const digits = normalizePhone(value);
  if (digits) {
    terms.add(digits);
    terms.add(formatPhone(digits));
  }

  return Array.from(terms);
}
