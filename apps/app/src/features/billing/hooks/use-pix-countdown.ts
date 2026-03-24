import { useEffect, useState } from "react";

interface UsePixCountdownResult {
  remainingSeconds: number;
  formatted: string;
  isExpired: boolean;
}

export function usePixCountdown(
  pixExpiresAt: string | null,
): UsePixCountdownResult {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculatePixRemainingSeconds(pixExpiresAt),
  );

  useEffect(() => {
    if (!pixExpiresAt) return;

    setRemainingSeconds(calculatePixRemainingSeconds(pixExpiresAt));

    const interval = setInterval(() => {
      const remaining = calculatePixRemainingSeconds(pixExpiresAt);
      setRemainingSeconds(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1_000);

    return () => clearInterval(interval);
  }, [pixExpiresAt]);

  const formatted = formatPixCountdown(remainingSeconds);

  return {
    remainingSeconds: Math.max(0, remainingSeconds),
    formatted,
    isExpired: remainingSeconds <= 0,
  };
}

export function calculatePixRemainingSeconds(
  expiresAt: string | null,
  now = Date.now(),
): number {
  if (!expiresAt) return 0;
  return Math.floor((new Date(expiresAt).getTime() - now) / 1000);
}

export function formatPixCountdown(remainingSeconds: number): string {
  const minutes = Math.floor(Math.max(0, remainingSeconds) / 60);
  const seconds = Math.max(0, remainingSeconds) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
