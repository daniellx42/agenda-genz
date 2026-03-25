import { describe, expect, it } from "bun:test";
import {
  DEFAULT_REVIEW_POLICY,
  deferReviewPrompt,
  ensureFirstOpen,
  getDefaultReviewSnapshot,
  incrementSuccessfulAppointments,
  markReviewPromptShown,
  markStoreReviewOpened,
  shouldPromptForReview,
} from "./review-policy";

describe("review-policy", () => {
  it("só libera o prompt depois do tempo e uso mínimos", () => {
    let snapshot = ensureFirstOpen(
      getDefaultReviewSnapshot(),
      new Date("2026-03-01T12:00:00.000Z"),
    );

    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = incrementSuccessfulAppointments(snapshot);

    expect(
      shouldPromptForReview(
        snapshot,
        DEFAULT_REVIEW_POLICY,
        new Date("2026-03-10T12:00:00.000Z"),
      ),
    ).toBe(false);

    expect(
      shouldPromptForReview(
        snapshot,
        DEFAULT_REVIEW_POLICY,
        new Date("2026-03-16T12:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("respeita o defer e o cooldown depois de abrir a loja", () => {
    let snapshot = ensureFirstOpen(
      getDefaultReviewSnapshot(),
      new Date("2026-03-01T12:00:00.000Z"),
    );

    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = deferReviewPrompt(
      snapshot,
      DEFAULT_REVIEW_POLICY,
      new Date("2026-03-16T12:00:00.000Z"),
    );

    expect(
      shouldPromptForReview(
        snapshot,
        DEFAULT_REVIEW_POLICY,
        new Date("2026-03-20T12:00:00.000Z"),
      ),
    ).toBe(false);

    snapshot = markStoreReviewOpened(
      snapshot,
      new Date("2026-03-31T12:00:00.000Z"),
    );

    expect(
      shouldPromptForReview(
        snapshot,
        DEFAULT_REVIEW_POLICY,
        new Date("2026-05-01T12:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("limita prompts dentro de 365 dias", () => {
    let snapshot = ensureFirstOpen(
      getDefaultReviewSnapshot(),
      new Date("2025-01-01T12:00:00.000Z"),
    );

    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = incrementSuccessfulAppointments(snapshot);
    snapshot = markReviewPromptShown(
      snapshot,
      new Date("2025-03-01T12:00:00.000Z"),
    );
    snapshot = markReviewPromptShown(
      snapshot,
      new Date("2025-06-01T12:00:00.000Z"),
    );
    snapshot = markReviewPromptShown(
      snapshot,
      new Date("2025-09-01T12:00:00.000Z"),
    );

    expect(
      shouldPromptForReview(
        snapshot,
        DEFAULT_REVIEW_POLICY,
        new Date("2025-12-01T12:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
