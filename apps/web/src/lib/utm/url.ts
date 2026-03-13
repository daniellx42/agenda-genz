import { env } from "@agenda-genz/env/web";

export function normalizeLandingPath(path: string | null | undefined) {
  const normalized = path?.trim();

  if (!normalized) {
    return "/";
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function buildPublicTrackingUrl(slug: string, landingPath = "/") {
  const url = new URL(normalizeLandingPath(landingPath), `${env.NEXT_PUBLIC_FRONTEND_URL}/`);

  url.searchParams.set("ref", slug);

  return url.toString();
}
