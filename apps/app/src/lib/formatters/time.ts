import { digitsOnly } from "./text";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function formatTime(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function normalizeTime(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);

  if (digits.length <= 2) return digits;

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function isValidTime(value: string): boolean {
  return TIME_REGEX.test(normalizeTime(value));
}
