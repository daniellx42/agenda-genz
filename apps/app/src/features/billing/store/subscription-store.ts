import { create } from "zustand";

interface SubscriptionState {
  planExpiresAt: string | null;
  isExpired: boolean;
  forcedExpired: boolean;

  setPlanExpiresAt: (date: string | Date | null | undefined) => void;
  forceExpired: () => void;
  checkExpired: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  planExpiresAt: null,
  isExpired: true,
  forcedExpired: false,

  setPlanExpiresAt: (date) => {
    const dateStr =
      date instanceof Date ? date.toISOString() : (date ?? null);
    const isExpired = !dateStr || new Date(dateStr) <= new Date();
    set((state) => ({
      planExpiresAt: dateStr,
      isExpired,
      forcedExpired: isExpired ? state.forcedExpired : false,
    }));
  },

  forceExpired: () => {
    set({
      planExpiresAt: null,
      isExpired: true,
      forcedExpired: true,
    });
  },

  checkExpired: () => {
    const { planExpiresAt, forcedExpired } = get();
    const isExpired =
      !planExpiresAt || new Date(planExpiresAt) <= new Date();
    set({
      isExpired,
      forcedExpired: isExpired ? forcedExpired : false,
    });
    return isExpired;
  },
}));
