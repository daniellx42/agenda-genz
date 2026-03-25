export const DELETE_ACCOUNT_CONFIRMATION_TEXT = "quero deletar minha conta";

export function normalizeDeletionConfirmation(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function canDeleteAccountWithConfirmation(value: string) {
  return (
    normalizeDeletionConfirmation(value) === DELETE_ACCOUNT_CONFIRMATION_TEXT
  );
}

export function getTrimmedDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function canSaveDisplayName(
  nextValue: string,
  currentValue: string | null | undefined,
) {
  const trimmedValue = getTrimmedDisplayName(nextValue);
  return trimmedValue.length >= 2 && trimmedValue !== (currentValue ?? "");
}
