"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { EventType } from "@/generated/utm-client/client";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/utm/constants";

import { recordLandingVisit, recordStoreClick } from "@/lib/utm/service";

type TrackLandingVisitInput = {
  pagePath?: string;
  referrer?: string | null;
  searchParams?: Record<string, string>;
};

export async function trackLandingVisitAction(input: TrackLandingVisitInput) {
  try {
    await recordLandingVisit({
      requestHeaders: await headers(),
      pagePath: input.pagePath,
      referrer: input.referrer,
      searchParams: input.searchParams,
    });

    return {
      ok: true as const,
    };
  } catch {
    return {
      ok: false as const,
    };
  }
}

export async function trackAppleStoreClickAction() {
  let destination = APP_STORE_URL;

  try {
    destination = await recordStoreClick(await headers(), EventType.APPLE_STORE_CLICK);
  } catch {}

  redirect(destination);
}

export async function trackPlayStoreClickAction() {
  let destination = PLAY_STORE_URL;

  try {
    destination = await recordStoreClick(await headers(), EventType.PLAY_STORE_CLICK);
  } catch {}

  redirect(destination);
}
