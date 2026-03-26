import {
  currencyToCents,
  digitsOnly,
  isValidCpf,
  normalizeCpf,
  normalizeEmail,
} from "@/lib/formatters";

export const DEFAULT_REFERRAL_REWARD_IN_CENTS = 100;
export const DEFAULT_MIN_WITHDRAWAL_IN_CENTS = 10_000;
export type ReferralPixKeyType = "CPF" | "PHONE" | "EMAIL" | "RANDOM";

export function normalizeReferralCode(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function normalizePixKey(value: string): string {
  return resolvePixKey(value)?.value ?? value.trim();
}

function isValidEmailPixKey(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidBrazilPhoneNationalDigits(value: string): boolean {
  return /^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/.test(value);
}

function normalizePhonePixKey(value: string): string | null {
  const trimmed = value.trim();
  const cleaned = trimmed.replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1);

    if (!digits.startsWith("55") || (digits.length !== 12 && digits.length !== 13)) {
      return null;
    }

    const nationalDigits = digits.slice(2);
    if (!isValidBrazilPhoneNationalDigits(nationalDigits)) {
      return null;
    }

    return `+55${nationalDigits}`;
  }

  const digits = digitsOnly(trimmed);
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    const nationalDigits = digits.slice(2);
    if (!isValidBrazilPhoneNationalDigits(nationalDigits)) {
      return null;
    }

    return `+55${nationalDigits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    if (!isValidBrazilPhoneNationalDigits(digits)) {
      return null;
    }

    return `+55${digits}`;
  }

  return null;
}

function hasPhoneFormattingHint(value: string): boolean {
  const trimmed = value.trim();
  const digits = digitsOnly(trimmed);

  return /[()+]/.test(trimmed) || /\s/.test(trimmed) || trimmed.startsWith("+") || digits.startsWith("55");
}

function isRandomPixKey(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function resolvePixKey(
  rawValue: string,
): { value: string; type: ReferralPixKeyType } | null {
  const trimmed = rawValue.trim();

  if (!trimmed || trimmed.length > 140) {
    return null;
  }

  if (trimmed.includes("@")) {
    const normalizedEmail = normalizeEmail(trimmed);
    if (!isValidEmailPixKey(normalizedEmail)) {
      return null;
    }

    return {
      value: normalizedEmail,
      type: "EMAIL",
    };
  }

  if (isRandomPixKey(trimmed)) {
    return {
      value: trimmed.toLowerCase(),
      type: "RANDOM",
    };
  }

  const normalizedPhone = normalizePhonePixKey(trimmed);
  if (hasPhoneFormattingHint(trimmed) && normalizedPhone) {
    return {
      value: normalizedPhone,
      type: "PHONE",
    };
  }

  if (isValidCpf(trimmed)) {
    return {
      value: normalizeCpf(trimmed),
      type: "CPF",
    };
  }

  if (normalizedPhone) {
    return {
      value: normalizedPhone,
      type: "PHONE",
    };
  }

  return null;
}

export function isValidPixKey(value: string): boolean {
  return resolvePixKey(value) !== null;
}

export function maskPixKey(value: string): string {
  if (!value) return "";

  const normalized = value.trim();
  if (normalized.includes("@")) {
    const [localPart, domain] = normalized.split("@");
    const prefix = localPart?.slice(0, 2) ?? "";
    return `${prefix}••••@${domain ?? ""}`;
  }

  if (normalized.length <= 8) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}••••${normalized.slice(-4)}`;
}

export function getWithdrawalAmountError(params: {
  value: string;
  availableBalanceInCents: number;
  minWithdrawalAmountInCents?: number;
}): string | null {
  const {
    value,
    availableBalanceInCents,
    minWithdrawalAmountInCents = DEFAULT_MIN_WITHDRAWAL_IN_CENTS,
  } = params;
  const amountInCents = currencyToCents(value);

  if (!amountInCents) {
    return "Informe o valor que deseja sacar.";
  }

  if (amountInCents < minWithdrawalAmountInCents) {
    return "O valor minimo para saque e R$ 100,00.";
  }

  if (amountInCents > availableBalanceInCents) {
    return "O valor nao pode ser maior que o seu saldo disponivel.";
  }

  return null;
}
