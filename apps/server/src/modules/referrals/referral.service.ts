import type { Prisma, ReferralPixKeyType } from "@agenda-genz/db";
import { status } from "elysia";
import crypto from "node:crypto";
import { prisma } from "../../shared/lib/db";
import { Errors } from "../../shared/constants/errors";
import { ReferralRepository } from "./referral.repository";
import type { ReferralModel } from "./referral.model";

const REFERRAL_REWARD_IN_CENTS = 100;
const MIN_WITHDRAWAL_AMOUNT_IN_CENTS = 10_000;
const REFERRAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERRAL_CODE_LENGTH = 8;
const WITHDRAWAL_TRANSACTION_RETRIES = 2;

type ReferralPromptStatus = ReferralModel.promptStatus;

function normalizeReferralCode(code: string): string {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function generateReferralCodeValue(): string {
  return Array.from({ length: REFERRAL_CODE_LENGTH }, () => {
    const index = crypto.randomInt(0, REFERRAL_CODE_ALPHABET.length);
    return REFERRAL_CODE_ALPHABET[index]!;
  }).join("");
}

function hasPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

function isUniqueConstraintError(error: unknown): boolean {
  return hasPrismaErrorCode(error, "P2002");
}

function isTransactionRetryError(error: unknown): boolean {
  return hasPrismaErrorCode(error, "P2034");
}

function resolvePromptStatus(
  statusValue: "APPLIED" | "DISMISSED" | null | undefined,
): ReferralPromptStatus {
  if (statusValue === "APPLIED") return "APPLIED";
  if (statusValue === "DISMISSED") return "DISMISSED";
  return "PENDING";
}

function normalizeCpf(value: string): string {
  return digitsOnly(value).slice(0, 11);
}

function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;

  return remainder === Number(cpf[10]);
}

function normalizeEmailPixKey(value: string): string {
  return value.replace(/\s/g, "").toLowerCase();
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

function resolvePixKey(
  rawValue: string,
): { value: string; type: ReferralPixKeyType } | null {
  const trimmed = rawValue.trim();

  if (!trimmed || trimmed.length > 140) {
    return null;
  }

  if (trimmed.includes("@")) {
    const normalizedEmail = normalizeEmailPixKey(trimmed);
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

async function computeAvailableBalanceInCents(
  userId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<number> {
  const [ownerRewardCount, invitedRewardCount, reservedWithdrawalsInCents] =
    await Promise.all([
      ReferralRepository.countGrantedOwnerRewards(userId, db),
      ReferralRepository.countGrantedInvitedRewards(userId, db),
      ReferralRepository.sumReservedWithdrawals(userId, db),
    ]);

  return Math.max(
    ownerRewardCount * REFERRAL_REWARD_IN_CENTS +
      invitedRewardCount * REFERRAL_REWARD_IN_CENTS -
      reservedWithdrawalsInCents,
    0,
  );
}

export abstract class ReferralService {
  static async getSummary(
    userId: string,
  ): Promise<ReferralModel.summaryResponse> {
    const [referralCode, referralUse, availableBalanceInCents, referralUsersCount] =
      await Promise.all([
        ReferralRepository.findCodeByUserId(userId),
        ReferralRepository.findUseByInvitedUserId(userId),
        computeAvailableBalanceInCents(userId),
        ReferralRepository.countReferralUsersByOwner(userId),
      ]);

    return {
      referralCode: referralCode?.code ?? null,
      availableBalanceInCents,
      referralUsersCount,
      rewardAmountInCents: REFERRAL_REWARD_IN_CENTS,
      minWithdrawalAmountInCents: MIN_WITHDRAWAL_AMOUNT_IN_CENTS,
      canWithdraw: availableBalanceInCents >= MIN_WITHDRAWAL_AMOUNT_IN_CENTS,
      promptStatus: resolvePromptStatus(referralUse?.status),
    };
  }

  static async generateCode(
    userId: string,
  ): Promise<ReferralModel.generateCodeResponse> {
    const existingCode = await ReferralRepository.findCodeByUserId(userId);

    if (existingCode) {
      return { code: existingCode.code };
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      try {
        const createdCode = await ReferralRepository.createCode({
          userId,
          code: generateReferralCodeValue(),
        });

        return { code: createdCode.code };
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const concurrentCode = await ReferralRepository.findCodeByUserId(userId);
        if (concurrentCode) {
          return { code: concurrentCode.code };
        }
      }
    }

    throw new Error("Não foi possível gerar um código de convite agora.");
  }

  static async dismissPrompt(userId: string): Promise<void> {
    await ReferralRepository.upsertDismissedUse(userId, new Date());
  }

  static async applyCode(
    userId: string,
    rawCode: string,
  ): Promise<ReferralModel.applyCodeResponse> {
    const referralUse = await ReferralRepository.findUseByInvitedUserId(userId);

    if (referralUse) {
      throw status(
        Errors.REFERRAL.PROMPT_ALREADY_COMPLETED.httpStatus,
        Errors.REFERRAL.PROMPT_ALREADY_COMPLETED.message,
      );
    }

    const normalizedCode = normalizeReferralCode(rawCode);
    const referralCode =
      normalizedCode.length > 0
        ? await ReferralRepository.findActiveCodeByCode(normalizedCode)
        : null;

    if (!referralCode) {
      throw status(
        Errors.REFERRAL.CODE_NOT_FOUND.httpStatus,
        Errors.REFERRAL.CODE_NOT_FOUND.message,
      );
    }

    if (referralCode.userId === userId) {
      throw status(
        Errors.REFERRAL.SELF_REFERRAL_FORBIDDEN.httpStatus,
        Errors.REFERRAL.SELF_REFERRAL_FORBIDDEN.message,
      );
    }

    const now = new Date();

    try {
      await ReferralRepository.createAppliedUse({
        referralCodeId: referralCode.id,
        invitedUserId: userId,
        code: referralCode.code,
        appliedAt: now,
        invitedRewardGrantedAt: now,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw status(
          Errors.REFERRAL.PROMPT_ALREADY_COMPLETED.httpStatus,
          Errors.REFERRAL.PROMPT_ALREADY_COMPLETED.message,
        );
      }

      throw error;
    }

    return {
      success: true,
      rewardAmountInCents: REFERRAL_REWARD_IN_CENTS,
    };
  }

  static async createWithdrawal(
    userId: string,
    amountInCents: number,
    rawPixKey: string,
  ): Promise<ReferralModel.createWithdrawalResponse> {
    if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
      throw status(
        Errors.REFERRAL.WITHDRAWAL_INVALID_AMOUNT.httpStatus,
        Errors.REFERRAL.WITHDRAWAL_INVALID_AMOUNT.message,
      );
    }

    if (amountInCents < MIN_WITHDRAWAL_AMOUNT_IN_CENTS) {
      throw status(
        Errors.REFERRAL.WITHDRAWAL_MIN_AMOUNT.httpStatus,
        Errors.REFERRAL.WITHDRAWAL_MIN_AMOUNT.message,
      );
    }

    const resolvedPixKey = resolvePixKey(rawPixKey);
    if (!resolvedPixKey) {
      throw status(
        Errors.REFERRAL.WITHDRAWAL_INVALID_PIX_KEY.httpStatus,
        Errors.REFERRAL.WITHDRAWAL_INVALID_PIX_KEY.message,
      );
    }

    for (let attempt = 0; attempt <= WITHDRAWAL_TRANSACTION_RETRIES; attempt += 1) {
      try {
        const withdrawal = await prisma.$transaction(
          async (tx) => {
            const availableBalanceInCents = await computeAvailableBalanceInCents(
              userId,
              tx,
            );

            if (amountInCents > availableBalanceInCents) {
              throw status(
                Errors.REFERRAL.WITHDRAWAL_INSUFFICIENT_BALANCE.httpStatus,
                Errors.REFERRAL.WITHDRAWAL_INSUFFICIENT_BALANCE.message,
              );
            }

            return ReferralRepository.createWithdrawal(
              {
                userId,
                amountInCents,
                pixKey: resolvedPixKey.value,
                pixKeyType: resolvedPixKey.type,
              },
              tx,
            );
          },
          {
            isolationLevel: "Serializable" as Prisma.TransactionIsolationLevel,
          },
        );

        return {
          id: withdrawal.id,
          amountInCents: withdrawal.amountInCents,
          pixKeyType: withdrawal.pixKeyType,
          status: "PENDING",
        };
      } catch (error) {
        if (attempt < WITHDRAWAL_TRANSACTION_RETRIES && isTransactionRetryError(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Não foi possível criar a solicitação de saque.");
  }

  static async grantOwnerRewardForApprovedPayment(
    invitedUserId: string,
    paymentId: string,
    rewardedAt: Date,
    db: Prisma.TransactionClient | typeof prisma = prisma,
  ): Promise<void> {
    await ReferralRepository.grantOwnerRewardForApprovedPayment(
      invitedUserId,
      paymentId,
      rewardedAt,
      db,
    );
  }
}
