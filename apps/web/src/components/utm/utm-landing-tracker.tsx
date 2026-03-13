"use client";

import { useEffect, useRef } from "react";

import { trackLandingVisitAction } from "@/app/actions/utm";

export default function UtmLandingTracker() {
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    const pagePath = window.location.pathname;
    const searchParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());
    const trackingKey = `${pagePath}?${new URLSearchParams(searchParams).toString()}`;

    if (lastTracked.current === trackingKey) {
      return;
    }

    lastTracked.current = trackingKey;

    void trackLandingVisitAction({
      pagePath,
      referrer: document.referrer || null,
      searchParams,
    });
  }, []);

  return null;
}
