import { create } from "zustand";

interface SubscriptionState {
  planExpiresAt: string | null;
  isExpired: boolean;

  setPlanExpiresAt: (date: string | Date | null | undefined) => void;
  checkExpired: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  planExpiresAt: null,
  isExpired: true,

  setPlanExpiresAt: (date) => {
    const dateStr =
      date instanceof Date ? date.toISOString() : (date ?? null);
    const isExpired = !dateStr || new Date(dateStr) <= new Date();
    set({ planExpiresAt: dateStr, isExpired });
  },

  checkExpired: () => {
    const { planExpiresAt } = get();
    const isExpired =
      !planExpiresAt || new Date(planExpiresAt) <= new Date();
    set({ isExpired });
    return isExpired;
  },
}));
