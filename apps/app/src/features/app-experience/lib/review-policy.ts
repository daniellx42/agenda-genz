export interface ReviewPolicy {
  enabled: boolean;
  minDaysSinceFirstOpen: number;
  minSuccessfulAppointments: number;
  deferPromptAfterDays: number;
  promptCooldownAfterDays: number;
  storeReviewCooldownAfterDays: number;
  maxPromptsPer365Days: number;
}

export interface ReviewSnapshot {
  firstOpenedAt: string | null;
  successfulAppointmentCount: number;
  lastPromptedAt: string | null;
  deferredUntilAt: string | null;
  lastStoreOpenedAt: string | null;
  promptHistory: string[];
}

export const DEFAULT_REVIEW_POLICY: ReviewPolicy = {
  enabled: true,
  minDaysSinceFirstOpen: 14,
  minSuccessfulAppointments: 3,
  deferPromptAfterDays: 14,
  promptCooldownAfterDays: 30,
  storeReviewCooldownAfterDays: 90,
  maxPromptsPer365Days: 3,
};

export function getDefaultReviewSnapshot(): ReviewSnapshot {
  return {
    firstOpenedAt: null,
    successfulAppointmentCount: 0,
    lastPromptedAt: null,
    deferredUntilAt: null,
    lastStoreOpenedAt: null,
    promptHistory: [],
  };
}

export function ensureFirstOpen(
  snapshot: ReviewSnapshot,
  now = new Date(),
): ReviewSnapshot {
  if (snapshot.firstOpenedAt) {
    return snapshot;
  }

  return {
    ...snapshot,
    firstOpenedAt: now.toISOString(),
  };
}

export function incrementSuccessfulAppointments(
  snapshot: ReviewSnapshot,
): ReviewSnapshot {
  return {
    ...snapshot,
    successfulAppointmentCount: snapshot.successfulAppointmentCount + 1,
  };
}

export function markReviewPromptShown(
  snapshot: ReviewSnapshot,
  now = new Date(),
): ReviewSnapshot {
  const nowIsoString = now.toISOString();

  return {
    ...snapshot,
    lastPromptedAt: nowIsoString,
    promptHistory: prunePromptHistory(
      [...snapshot.promptHistory, nowIsoString],
      now,
    ),
  };
}

export function deferReviewPrompt(
  snapshot: ReviewSnapshot,
  policy: ReviewPolicy,
  now = new Date(),
): ReviewSnapshot {
  return {
    ...snapshot,
    deferredUntilAt: addDays(now, policy.deferPromptAfterDays).toISOString(),
  };
}

export function markStoreReviewOpened(
  snapshot: ReviewSnapshot,
  now = new Date(),
): ReviewSnapshot {
  return {
    ...snapshot,
    deferredUntilAt: null,
    lastStoreOpenedAt: now.toISOString(),
  };
}

export function shouldPromptForReview(
  snapshot: ReviewSnapshot,
  policy: ReviewPolicy,
  now = new Date(),
): boolean {
  if (!policy.enabled || !snapshot.firstOpenedAt) {
    return false;
  }

  if (snapshot.successfulAppointmentCount < policy.minSuccessfulAppointments) {
    return false;
  }

  if (
    daysSince(new Date(snapshot.firstOpenedAt), now) <
    policy.minDaysSinceFirstOpen
  ) {
    return false;
  }

  if (
    snapshot.deferredUntilAt &&
    new Date(snapshot.deferredUntilAt).getTime() > now.getTime()
  ) {
    return false;
  }

  if (
    snapshot.lastPromptedAt &&
    daysSince(new Date(snapshot.lastPromptedAt), now) <
      policy.promptCooldownAfterDays
  ) {
    return false;
  }

  if (
    snapshot.lastStoreOpenedAt &&
    daysSince(new Date(snapshot.lastStoreOpenedAt), now) <
      policy.storeReviewCooldownAfterDays
  ) {
    return false;
  }

  return (
    prunePromptHistory(snapshot.promptHistory, now).length <
    policy.maxPromptsPer365Days
  );
}

function prunePromptHistory(promptHistory: string[], now: Date): string[] {
  return promptHistory.filter((value) => {
    const currentDate = new Date(value);
    return daysSince(currentDate, now) < 365;
  });
}

function daysSince(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return (endDate.getTime() - startDate.getTime()) / millisecondsPerDay;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
