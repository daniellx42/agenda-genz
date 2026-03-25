import {
  isValidCpf,
  isValidEmail,
  isValidInstagram,
  normalizeCpf,
  normalizeEmail,
  normalizeInstagram,
  normalizePhone,
  normalizeWhitespace,
} from "@/lib/formatters";
import { z } from "zod";
import {
  formatBirthDateInput,
  isValidBirthDateInput,
  toBirthDateValue,
} from "./client-birthday";

export const clientSchema = z.object({
  name: z
    .string()
    .transform(normalizeWhitespace)
    .refine((value) => value.length >= 2, "Informe pelo menos 2 caracteres"),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine(
      (value) => value.length === 10 || value.length === 11,
      "Telefone inválido",
    ),
  email: z
    .string()
    .transform(normalizeEmail)
    .refine(
      (value) => value.length === 0 || isValidEmail(value),
      "Email inválido",
    )
    .transform((value) => value || undefined),
  instagram: z
    .string()
    .transform(normalizeInstagram)
    .refine(
      (value) => value.length === 0 || isValidInstagram(value),
      "Instagram inválido",
    )
    .transform((value) => value || undefined),
  cpf: z
    .string()
    .transform(normalizeCpf)
    .refine(
      (value) => value.length === 0 || isValidCpf(value),
      "CPF inválido",
    )
    .transform((value) => value || undefined),
  address: z
    .string()
    .transform(normalizeWhitespace)
    .refine((value) => value.length <= 240, "Máximo de 240 caracteres")
    .transform((value) => value || undefined),
  birthDate: z
    .string()
    .transform(formatBirthDateInput)
    .refine(
      (value) => value.length === 0 || isValidBirthDateInput(value),
      "Data de nascimento inválida",
    )
    .transform((value) => (value ? toBirthDateValue(value) : undefined)),
  gender: z
    .enum(["", "FEMALE", "MALE", "OTHER"])
    .transform((value) => value || undefined),
  notes: z
    .string()
    .transform(normalizeWhitespace)
    .refine((value) => value.length <= 500, "Máximo de 500 caracteres")
    .transform((value) => value || undefined),
});

export type ClientFormValues = z.input<typeof clientSchema>;
export type ParsedClientFormValues = z.output<typeof clientSchema>;
