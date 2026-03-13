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
    calcRemaining(pixExpiresAt),
  );

  useEffect(() => {
    if (!pixExpiresAt) return;

    setRemainingSeconds(calcRemaining(pixExpiresAt));

    const interval = setInterval(() => {
      const remaining = calcRemaining(pixExpiresAt);
      setRemainingSeconds(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1_000);

    return () => clearInterval(interval);
  }, [pixExpiresAt]);

  const minutes = Math.floor(Math.max(0, remainingSeconds) / 60);
  const seconds = Math.max(0, remainingSeconds) % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    remainingSeconds: Math.max(0, remainingSeconds),
    formatted,
    isExpired: remainingSeconds <= 0,
  };
}

function calcRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  return Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
}
