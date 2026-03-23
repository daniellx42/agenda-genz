export const APP_TAB_ROUTE_NAMES = [
  "appointments",
  "clients",
  "services",
  "time-slots",
] as const;

export type AppTabRouteName = (typeof APP_TAB_ROUTE_NAMES)[number];
