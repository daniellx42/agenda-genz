import { afterEach, describe, expect, it } from "bun:test";
import { useSubscriptionStore } from "./subscription-store";

afterEach(() => {
  useSubscriptionStore.setState({
    planExpiresAt: null,
    isExpired: true,
    forcedExpired: false,
  });
});

describe("subscription-store", () => {
  it("marca expiração forçada e limpa quando recebe um plano futuro", () => {
    useSubscriptionStore.getState().forceExpired();

    expect(useSubscriptionStore.getState().forcedExpired).toBe(true);

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    useSubscriptionStore.getState().setPlanExpiresAt(futureDate);

    expect(useSubscriptionStore.getState().isExpired).toBe(false);
    expect(useSubscriptionStore.getState().forcedExpired).toBe(false);
  });

  it("checkExpired reflete corretamente passado e futuro", () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    useSubscriptionStore.getState().setPlanExpiresAt(pastDate);

    expect(useSubscriptionStore.getState().checkExpired()).toBe(true);

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    useSubscriptionStore.getState().setPlanExpiresAt(futureDate);

    expect(useSubscriptionStore.getState().checkExpired()).toBe(false);
  });
});
