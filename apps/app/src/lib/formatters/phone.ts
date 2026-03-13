import { digitsOnly } from "./text";

export function formatPhone(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);

  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function normalizePhone(value: string): string {
  return digitsOnly(value).slice(0, 11);
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value);
  return phone.length === 10 || phone.length === 11;
}
