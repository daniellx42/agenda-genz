import { env } from "@agenda-genz/env/web";

export const TRACKING_COOKIE_NAME = "__utm_tracking";
export const TRACKING_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const APP_STORE_URL = env.NEXT_PUBLIC_APP_STORE_URL;
export const PLAY_STORE_URL =
  env.NEXT_PUBLIC_PLAY_STORE_URL;

export const UTM_SOURCE_OPTIONS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "google",
  "kwai",
  "twitter",
  "whatsapp",
  "telegram",
  "organic",
  "direct",
  "other",
] as const;

export const DASHBOARD_RANGE_OPTIONS = [
  { label: "7 dias", value: "7" },
  { label: "30 dias", value: "30" },
  { label: "90 dias", value: "90" },
] as const;
