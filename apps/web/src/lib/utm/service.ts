import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { DeviceType, EventType } from "@/generated/utm-client/client";
import { APP_STORE_URL, PLAY_STORE_URL, TRACKING_COOKIE_MAX_AGE, TRACKING_COOKIE_NAME } from "@/lib/utm/constants";
import { utmPrisma } from "@/lib/utm/prisma";
import type {
  DashboardGroupRow,
  DashboardLinkRow,
  DashboardOverview,
  DashboardSeriesPoint,
  UtmDashboardData
} from "@/lib/utm/types";
import { buildPublicTrackingUrl } from "@/lib/utm/url";
import { env } from "@agenda-genz/env/web";

type TrackingCookie = {
  sessionId: string;
  pageVisitId: string | null;
  trackingLinkId: string | null;
  slug: string | null;
  source: string;
  campaign: string | null;
  influencer: string | null;
  creativeLabel: string | null;
  landingPath: string;
  updatedAt: string;
};

export type DashboardQueryInput = {
  mode?: string | null;
  rangeDays?: string | number | null;
};

type RecordVisitInput = {
  pagePath?: string | null;
  referrer?: string | null;
  requestHeaders: Headers;
  searchParams?: URLSearchParams | Record<string, string | null | undefined>;
  trackingLinkId?: string | null;
};

type AggregateCounts = {
  totalVisits: number;
  appleStoreClicks: number;
  playStoreClicks: number;
};

const DEFAULT_RANGE_DAYS = 30;
const AGGREGATE_CURSOR_ID = "default";
const AGGREGATE_OVERVIEW_ID = "default";
const BATCH_SIZE = 500;

const dashboardModeSchema = z.enum(["aggregate", "realtime"]).default("aggregate");

const trackingLinkSchema = z.object({
  name: z.string().min(3, "Informe um nome para o link"),
  slug: z
    .string()
    .min(3, "O slug precisa ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  description: z.string().trim().max(240).optional().or(z.literal("")),
  landingPath: z
    .string()
    .trim()
    .default("/")
    .refine((value) => value.startsWith("/"), "A rota precisa começar com /"),
  source: z.string().min(1, "Informe a origem"),
  medium: z.string().trim().optional().or(z.literal("")),
  campaign: z.string().trim().optional().or(z.literal("")),
  term: z.string().trim().optional().or(z.literal("")),
  content: z.string().trim().optional().or(z.literal("")),
  influencer: z.string().trim().optional().or(z.literal("")),
  platform: z.string().trim().optional().or(z.literal("")),
  creativeLabel: z.string().trim().optional().or(z.literal("")),
  creativeType: z.string().trim().optional().or(z.literal("")),
});

export type CreateTrackingLinkInput = z.infer<typeof trackingLinkSchema>;

function toNullableString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseSearchParams(input?: URLSearchParams | Record<string, string | null | undefined>) {
  if (!input) {
    return new URLSearchParams();
  }

  if (input instanceof URLSearchParams) {
    return input;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value) {
      params.set(key, value);
    }
  }

  return params;
}

function normalizeRangeDays(value: string | number | null | undefined) {
  const parsed = Number(value ?? DEFAULT_RANGE_DAYS);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RANGE_DAYS;
  }

  return Math.min(parsed, 365);
}

function normalizeSource(value: string | null | undefined) {
  return value?.trim().toLowerCase() || "direct";
}

function getTrackingCookieValue(rawValue: string | undefined) {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as TrackingCookie;
  } catch {
    return null;
  }
}

async function writeTrackingCookie(payload: TrackingCookie) {
  const cookieStore = await cookies();

  cookieStore.set(TRACKING_COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: TRACKING_COOKIE_MAX_AGE,
  });
}

export async function getTrackingCookie() {
  const cookieStore = await cookies();
  return getTrackingCookieValue(cookieStore.get(TRACKING_COOKIE_NAME)?.value);
}

function getDeviceType(userAgent: string | null) {
  if (!userAgent) {
    return DeviceType.UNKNOWN;
  }

  const normalized = userAgent.toLowerCase();

  if (/ipad|tablet/.test(normalized)) {
    return DeviceType.TABLET;
  }

  if (/mobile|iphone|android/.test(normalized)) {
    return DeviceType.MOBILE;
  }

  if (/macintosh|windows|linux/.test(normalized)) {
    return DeviceType.DESKTOP;
  }

  return DeviceType.UNKNOWN;
}

function extractIpAddress(requestHeaders: Headers) {
  const forwarded = requestHeaders.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return requestHeaders.get("x-real-ip");
}

function hasAttributionSearchParams(searchParams: URLSearchParams) {
  return [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "influencer",
    "platform",
    "creative",
    "creative_type",
    "ref",
  ].some((key) => searchParams.has(key));
}

function toBucketDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function buildDailyBucketKey(input: {
  date: Date;
  trackingLinkId: string | null;
  source: string;
  campaign: string | null;
  influencer: string | null;
}) {
  return [
    input.date.toISOString().slice(0, 10),
    input.trackingLinkId ?? "none",
    input.source,
    input.campaign ?? "none",
    input.influencer ?? "none",
  ].join(":");
}

function toDashboardPointMap(rangeDays: number) {
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (rangeDays - 1));

  const map = new Map<string, DashboardSeriesPoint>();

  for (let index = 0; index < rangeDays; index += 1) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    const key = current.toISOString().slice(0, 10);

    map.set(key, {
      date: key,
      visits: 0,
      appleStoreClicks: 0,
      playStoreClicks: 0,
    });
  }

  return map;
}

function buildOverview(counts: AggregateCounts, extra: Omit<DashboardOverview, keyof AggregateCounts | "conversionRate">): DashboardOverview {
  const totalClicks = counts.appleStoreClicks + counts.playStoreClicks;

  return {
    totalVisits: counts.totalVisits,
    appleStoreClicks: counts.appleStoreClicks,
    playStoreClicks: counts.playStoreClicks,
    conversionRate: counts.totalVisits > 0 ? Number(((totalClicks / counts.totalVisits) * 100).toFixed(1)) : 0,
    ...extra,
  };
}

function upsertGroupRow(map: Map<string, DashboardGroupRow>, key: string | null | undefined, event: Partial<AggregateCounts>) {
  const normalizedKey = key?.trim();

  if (!normalizedKey) {
    return;
  }

  const current = map.get(normalizedKey) ?? {
    name: normalizedKey,
    totalVisits: 0,
    appleStoreClicks: 0,
    playStoreClicks: 0,
    conversionRate: 0,
  };

  current.totalVisits += event.totalVisits ?? 0;
  current.appleStoreClicks += event.appleStoreClicks ?? 0;
  current.playStoreClicks += event.playStoreClicks ?? 0;
  current.conversionRate =
    current.totalVisits > 0
      ? Number((((current.appleStoreClicks + current.playStoreClicks) / current.totalVisits) * 100).toFixed(1))
      : 0;

  map.set(normalizedKey, current);
}

function sortGroupRows(map: Map<string, DashboardGroupRow>) {
  return [...map.values()].sort((left, right) => right.totalVisits - left.totalVisits).slice(0, 8);
}

async function getTrackingLinkFromParams(params: URLSearchParams, fallbackId?: string | null) {
  if (fallbackId) {
    return utmPrisma.trackingLink.findUnique({
      where: {
        id: fallbackId,
      },
    });
  }

  const slug = params.get("ref");

  if (!slug) {
    return null;
  }

  return utmPrisma.trackingLink.findUnique({
    where: {
      slug,
    },
  });
}

function buildVisitContext(params: URLSearchParams, trackingLink: Awaited<ReturnType<typeof getTrackingLinkFromParams>>) {
  if (trackingLink) {
    return {
      trackingLinkId: trackingLink.id,
      slug: trackingLink.slug,
      source: normalizeSource(trackingLink.source),
      medium: toNullableString(trackingLink.medium),
      campaign: toNullableString(trackingLink.campaign),
      term: toNullableString(trackingLink.term),
      content: toNullableString(trackingLink.content),
      influencer: toNullableString(trackingLink.influencer),
      platform: toNullableString(trackingLink.platform),
      creativeLabel: toNullableString(trackingLink.creativeLabel),
      creativeType: toNullableString(trackingLink.creativeType),
      landingPath: trackingLink.landingPath,
    };
  }

  return {
    trackingLinkId: null,
    slug: null,
    source: normalizeSource(params.get("utm_source")),
    medium: toNullableString(params.get("utm_medium")),
    campaign: toNullableString(params.get("utm_campaign")),
    term: toNullableString(params.get("utm_term")),
    content: toNullableString(params.get("utm_content")),
    influencer: toNullableString(params.get("influencer")),
    platform: toNullableString(params.get("platform")),
    creativeLabel: toNullableString(params.get("creative") ?? params.get("asset")),
    creativeType: toNullableString(params.get("creative_type")),
    landingPath: "/",
  };
}

export async function createTrackingLink(input: unknown) {
  const parsed = trackingLinkSchema.parse(input);

  const link = await utmPrisma.trackingLink.create({
    data: {
      name: parsed.name.trim(),
      slug: parsed.slug.trim().toLowerCase(),
      description: toNullableString(parsed.description),
      landingPath: parsed.landingPath.trim(),
      source: normalizeSource(parsed.source),
      medium: toNullableString(parsed.medium),
      campaign: toNullableString(parsed.campaign),
      term: toNullableString(parsed.term),
      content: toNullableString(parsed.content),
      influencer: toNullableString(parsed.influencer),
      platform: toNullableString(parsed.platform),
      creativeLabel: toNullableString(parsed.creativeLabel),
      creativeType: toNullableString(parsed.creativeType),
    },
  });

  return {
    ...link,
    publicUrl: buildPublicTrackingUrl(link.slug, link.landingPath),
  };
}

export async function recordLandingVisit({
  pagePath,
  referrer,
  requestHeaders,
  searchParams,
  trackingLinkId,
}: RecordVisitInput) {
  const normalizedPath = pagePath?.startsWith("/") ? pagePath : "/";
  const params = parseSearchParams(searchParams);
  const cookieStore = await cookies();
  const existingCookie = getTrackingCookieValue(cookieStore.get(TRACKING_COOKIE_NAME)?.value);
  const trackingLink = await getTrackingLinkFromParams(params, trackingLinkId);
  const context = buildVisitContext(params, trackingLink);

  if (
    existingCookie?.pageVisitId &&
    !trackingLink &&
    !hasAttributionSearchParams(params) &&
    existingCookie.landingPath === normalizedPath
  ) {
    return existingCookie;
  }

  if (
    existingCookie?.pageVisitId &&
    !trackingLink &&
    hasAttributionSearchParams(params) &&
    existingCookie.source === context.source &&
    existingCookie.campaign === context.campaign &&
    existingCookie.influencer === context.influencer
  ) {
    return existingCookie;
  }

  const sessionId = existingCookie?.sessionId ?? crypto.randomUUID();
  const userAgent = requestHeaders.get("user-agent");

  const visit = await utmPrisma.pageVisit.create({
    data: {
      sessionId,
      trackingLinkId: context.trackingLinkId,
      source: context.source,
      medium: context.medium,
      campaign: context.campaign,
      term: context.term,
      content: context.content,
      influencer: context.influencer,
      platform: context.platform,
      creativeLabel: context.creativeLabel,
      creativeType: context.creativeType,
      pagePath: normalizedPath,
      referrer: referrer ?? requestHeaders.get("referer"),
      ipAddress: extractIpAddress(requestHeaders),
      userAgent,
      deviceType: getDeviceType(userAgent),
    },
  });

  const cookiePayload: TrackingCookie = {
    sessionId,
    pageVisitId: visit.id,
    trackingLinkId: visit.trackingLinkId,
    slug: context.slug,
    source: visit.source,
    campaign: visit.campaign,
    influencer: visit.influencer,
    creativeLabel: visit.creativeLabel,
    landingPath: context.landingPath,
    updatedAt: new Date().toISOString(),
  };

  await writeTrackingCookie(cookiePayload);

  return cookiePayload;
}

async function ensureVisitFromCookie(requestHeaders: Headers, destinationPath = "/") {
  const trackingCookie = await getTrackingCookie();

  if (trackingCookie?.pageVisitId) {
    return trackingCookie;
  }

  return recordLandingVisit({
    requestHeaders,
    pagePath: destinationPath,
  });
}

export async function recordStoreClick(requestHeaders: Headers, eventType: EventType) {
  const trackingCookie = await ensureVisitFromCookie(requestHeaders);
  const pageVisitId = trackingCookie.pageVisitId;

  if (!pageVisitId) {
    throw new Error("Unable to create a tracking visit for outbound click.");
  }

  const visit = await utmPrisma.pageVisit.findUnique({
    where: {
      id: pageVisitId,
    },
    select: {
      trackingLinkId: true,
      source: true,
      campaign: true,
      influencer: true,
      creativeLabel: true,
    },
  });

  await utmPrisma.pageEvent.create({
    data: {
      eventType,
      sessionId: trackingCookie.sessionId,
      pageVisitId,
      trackingLinkId: visit?.trackingLinkId ?? trackingCookie.trackingLinkId,
      source: visit?.source ?? trackingCookie.source,
      campaign: visit?.campaign ?? trackingCookie.campaign,
      influencer: visit?.influencer ?? trackingCookie.influencer,
      creativeLabel: visit?.creativeLabel ?? trackingCookie.creativeLabel,
      destination: eventType === EventType.APPLE_STORE_CLICK ? APP_STORE_URL : PLAY_STORE_URL,
    },
  });

  return eventType === EventType.APPLE_STORE_CLICK ? APP_STORE_URL : PLAY_STORE_URL;
}

async function ensureAggregateState() {
  await Promise.all([
    utmPrisma.aggregateCursor.upsert({
      where: {
        id: AGGREGATE_CURSOR_ID,
      },
      create: {
        id: AGGREGATE_CURSOR_ID,
      },
      update: {},
    }),
    utmPrisma.aggregateOverview.upsert({
      where: {
        id: AGGREGATE_OVERVIEW_ID,
      },
      create: {
        id: AGGREGATE_OVERVIEW_ID,
      },
      update: {},
    }),
  ]);
}

async function updateLinkConversionRates(linkIds?: string[]) {
  const links = await utmPrisma.aggregateLink.findMany({
    where: linkIds?.length
      ? {
        trackingLinkId: {
          in: linkIds,
        },
      }
      : undefined,
    select: {
      id: true,
      totalVisits: true,
      appleStoreClicks: true,
      playStoreClicks: true,
    },
  });

  await Promise.all(
    links.map((link) =>
      utmPrisma.aggregateLink.update({
        where: {
          id: link.id,
        },
        data: {
          conversionRate:
            link.totalVisits > 0
              ? Number((((link.appleStoreClicks + link.playStoreClicks) / link.totalVisits) * 100).toFixed(1))
              : 0,
        },
      }),
    ),
  );
}

export async function runAggregateRefresh() {
  await ensureAggregateState();

  const cursor = await utmPrisma.aggregateCursor.findUniqueOrThrow({
    where: {
      id: AGGREGATE_CURSOR_ID,
    },
  });

  let processedVisits = 0;
  let processedEvents = 0;
  const touchedLinkIds = new Set<string>();
  let visitCursor = {
    createdAt: cursor.lastProcessedVisitCreatedAt,
    id: cursor.lastProcessedVisitId,
  };
  let eventCursor = {
    createdAt: cursor.lastProcessedEventCreatedAt,
    id: cursor.lastProcessedEventId,
  };

  while (true) {
    const visits = await utmPrisma.pageVisit.findMany({
      where: visitCursor.createdAt
        ? {
          OR: [
            {
              createdAt: {
                gt: visitCursor.createdAt,
              },
            },
            {
              createdAt: visitCursor.createdAt,
              id: {
                gt: visitCursor.id ?? "",
              },
            },
          ],
        }
        : undefined,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: BATCH_SIZE,
      select: {
        id: true,
        createdAt: true,
        trackingLinkId: true,
        source: true,
        campaign: true,
        influencer: true,
      },
    });

    if (!visits.length) {
      break;
    }

    const dailyBuckets = new Map<
      string,
      {
        bucketKey: string;
        date: Date;
        trackingLinkId: string | null;
        source: string;
        campaign: string | null;
        influencer: string | null;
        totalVisits: number;
      }
    >();
    const linkBuckets = new Map<string, { totalVisits: number; lastVisitAt: Date; slug: string; name: string; source: string; campaign: string | null; influencer: string | null }>();
    const links = await utmPrisma.trackingLink.findMany({
      where: {
        id: {
          in: [...new Set(visits.map((visit) => visit.trackingLinkId).filter(Boolean) as string[])],
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        source: true,
        campaign: true,
        influencer: true,
      },
    });
    const linksById = new Map(links.map((link) => [link.id, link]));

    for (const visit of visits) {
      const date = toBucketDate(visit.createdAt);
      const bucketKey = buildDailyBucketKey({
        date,
        trackingLinkId: visit.trackingLinkId,
        source: visit.source,
        campaign: visit.campaign,
        influencer: visit.influencer,
      });
      const currentDaily = dailyBuckets.get(bucketKey) ?? {
        bucketKey,
        date,
        trackingLinkId: visit.trackingLinkId,
        source: visit.source,
        campaign: visit.campaign,
        influencer: visit.influencer,
        totalVisits: 0,
      };

      currentDaily.totalVisits += 1;
      dailyBuckets.set(bucketKey, currentDaily);

      if (visit.trackingLinkId) {
        const link = linksById.get(visit.trackingLinkId);

        if (link) {
          const currentLink = linkBuckets.get(visit.trackingLinkId) ?? {
            totalVisits: 0,
            lastVisitAt: visit.createdAt,
            slug: link.slug,
            name: link.name,
            source: link.source,
            campaign: link.campaign,
            influencer: link.influencer,
          };

          currentLink.totalVisits += 1;
          currentLink.lastVisitAt = visit.createdAt;
          linkBuckets.set(visit.trackingLinkId, currentLink);
          touchedLinkIds.add(visit.trackingLinkId);
        }
      }
    }

    const lastVisit = visits.at(-1)!;

    await utmPrisma.$transaction(async (tx) => {
      for (const bucket of dailyBuckets.values()) {
        await tx.aggregateDaily.upsert({
          where: {
            bucketKey: bucket.bucketKey,
          },
          create: {
            bucketKey: bucket.bucketKey,
            date: bucket.date,
            trackingLinkId: bucket.trackingLinkId,
            source: bucket.source,
            campaign: bucket.campaign,
            influencer: bucket.influencer,
            totalVisits: bucket.totalVisits,
          },
          update: {
            totalVisits: {
              increment: bucket.totalVisits,
            },
            source: bucket.source,
            campaign: bucket.campaign,
            influencer: bucket.influencer,
            trackingLinkId: bucket.trackingLinkId,
          },
        });
      }

      for (const [trackingLinkId, bucket] of linkBuckets.entries()) {
        await tx.aggregateLink.upsert({
          where: {
            trackingLinkId,
          },
          create: {
            trackingLinkId,
            slug: bucket.slug,
            name: bucket.name,
            source: bucket.source,
            campaign: bucket.campaign,
            influencer: bucket.influencer,
            totalVisits: bucket.totalVisits,
            lastVisitAt: bucket.lastVisitAt,
          },
          update: {
            slug: bucket.slug,
            name: bucket.name,
            source: bucket.source,
            campaign: bucket.campaign,
            influencer: bucket.influencer,
            totalVisits: {
              increment: bucket.totalVisits,
            },
            lastVisitAt: bucket.lastVisitAt,
            lastAggregatedAt: new Date(),
          },
        });
      }

      await tx.aggregateOverview.update({
        where: {
          id: AGGREGATE_OVERVIEW_ID,
        },
        data: {
          generatedAt: new Date(),
          totalVisits: {
            increment: visits.length,
          },
          lastVisitAt: lastVisit.createdAt,
        },
      });

      await tx.aggregateCursor.update({
        where: {
          id: AGGREGATE_CURSOR_ID,
        },
        data: {
          lastProcessedVisitCreatedAt: lastVisit.createdAt,
          lastProcessedVisitId: lastVisit.id,
        },
      });
    });

    processedVisits += visits.length;
    visitCursor = {
      createdAt: lastVisit.createdAt,
      id: lastVisit.id,
    };
  }

  while (true) {
    const events = await utmPrisma.pageEvent.findMany({
      where: eventCursor.createdAt
        ? {
          OR: [
            {
              createdAt: {
                gt: eventCursor.createdAt,
              },
            },
            {
              createdAt: eventCursor.createdAt,
              id: {
                gt: eventCursor.id ?? "",
              },
            },
          ],
        }
        : undefined,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: BATCH_SIZE,
      select: {
        id: true,
        createdAt: true,
        eventType: true,
        trackingLinkId: true,
        source: true,
        campaign: true,
        influencer: true,
      },
    });

    if (!events.length) {
      break;
    }

    const dailyBuckets = new Map<
      string,
      {
        bucketKey: string;
        appleStoreClicks: number;
        playStoreClicks: number;
        date: Date;
        trackingLinkId: string | null;
        source: string;
        campaign: string | null;
        influencer: string | null;
      }
    >();
    const linkBuckets = new Map<
      string,
      {
        appleStoreClicks: number;
        playStoreClicks: number;
      }
    >();

    for (const event of events) {
      const date = toBucketDate(event.createdAt);
      const bucketKey = buildDailyBucketKey({
        date,
        trackingLinkId: event.trackingLinkId,
        source: event.source,
        campaign: event.campaign,
        influencer: event.influencer,
      });
      const currentDaily = dailyBuckets.get(bucketKey) ?? {
        bucketKey,
        appleStoreClicks: 0,
        playStoreClicks: 0,
        date,
        trackingLinkId: event.trackingLinkId,
        source: event.source,
        campaign: event.campaign,
        influencer: event.influencer,
      };

      if (event.eventType === EventType.APPLE_STORE_CLICK) {
        currentDaily.appleStoreClicks += 1;
      }

      if (event.eventType === EventType.PLAY_STORE_CLICK) {
        currentDaily.playStoreClicks += 1;
      }

      dailyBuckets.set(bucketKey, currentDaily);

      if (event.trackingLinkId) {
        const currentLink = linkBuckets.get(event.trackingLinkId) ?? {
          appleStoreClicks: 0,
          playStoreClicks: 0,
        };

        if (event.eventType === EventType.APPLE_STORE_CLICK) {
          currentLink.appleStoreClicks += 1;
        }

        if (event.eventType === EventType.PLAY_STORE_CLICK) {
          currentLink.playStoreClicks += 1;
        }

        linkBuckets.set(event.trackingLinkId, currentLink);
        touchedLinkIds.add(event.trackingLinkId);
      }
    }

    const lastEvent = events.at(-1)!;

    await utmPrisma.$transaction(async (tx) => {
      for (const bucket of dailyBuckets.values()) {
        await tx.aggregateDaily.upsert({
          where: {
            bucketKey: bucket.bucketKey,
          },
          create: {
            bucketKey: bucket.bucketKey,
            date: bucket.date,
            trackingLinkId: bucket.trackingLinkId,
            source: bucket.source,
            campaign: bucket.campaign,
            influencer: bucket.influencer,
            appleStoreClicks: bucket.appleStoreClicks,
            playStoreClicks: bucket.playStoreClicks,
          },
          update: {
            appleStoreClicks: {
              increment: bucket.appleStoreClicks,
            },
            playStoreClicks: {
              increment: bucket.playStoreClicks,
            },
            source: bucket.source,
            campaign: bucket.campaign,
            influencer: bucket.influencer,
            trackingLinkId: bucket.trackingLinkId,
          },
        });
      }

      for (const [trackingLinkId, bucket] of linkBuckets.entries()) {
        await tx.aggregateLink.update({
          where: {
            trackingLinkId,
          },
          data: {
            appleStoreClicks: {
              increment: bucket.appleStoreClicks,
            },
            playStoreClicks: {
              increment: bucket.playStoreClicks,
            },
            lastAggregatedAt: new Date(),
          },
        });
      }

      await tx.aggregateOverview.update({
        where: {
          id: AGGREGATE_OVERVIEW_ID,
        },
        data: {
          generatedAt: new Date(),
          appleStoreClicks: {
            increment: events.filter((event) => event.eventType === EventType.APPLE_STORE_CLICK).length,
          },
          playStoreClicks: {
            increment: events.filter((event) => event.eventType === EventType.PLAY_STORE_CLICK).length,
          },
        },
      });

      await tx.aggregateCursor.update({
        where: {
          id: AGGREGATE_CURSOR_ID,
        },
        data: {
          lastProcessedEventCreatedAt: lastEvent.createdAt,
          lastProcessedEventId: lastEvent.id,
        },
      });
    });

    processedEvents += events.length;
    eventCursor = {
      createdAt: lastEvent.createdAt,
      id: lastEvent.id,
    };
  }

  await updateLinkConversionRates([...touchedLinkIds]);

  return {
    processedVisits,
    processedEvents,
    generatedAt: new Date().toISOString(),
  };
}

async function getAggregateDashboard(rangeDays: number): Promise<UtmDashboardData> {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (rangeDays - 1));
  start.setUTCHours(0, 0, 0, 0);

  const [overviewRow, dailyRows, linkRows, totalLinks] = await Promise.all([
    utmPrisma.aggregateOverview.findUnique({
      where: {
        id: AGGREGATE_OVERVIEW_ID,
      },
    }),
    utmPrisma.aggregateDaily.findMany({
      where: {
        date: {
          gte: start,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        source: true,
        campaign: true,
        influencer: true,
        totalVisits: true,
        appleStoreClicks: true,
        playStoreClicks: true,
      },
    }),
    utmPrisma.aggregateLink.findMany({
      orderBy: {
        totalVisits: "desc",
      },
      take: 12,
      select: {
        id: true,
        slug: true,
        name: true,
        source: true,
        campaign: true,
        influencer: true,
        totalVisits: true,
        appleStoreClicks: true,
        playStoreClicks: true,
        conversionRate: true,
        trackingLink: {
          select: {
            landingPath: true,
          },
        },
      },
    }),
    utmPrisma.trackingLink.count(),
  ]);

  const seriesMap = toDashboardPointMap(rangeDays);
  const influencerMap = new Map<string, DashboardGroupRow>();
  const campaignMap = new Map<string, DashboardGroupRow>();
  const sourceMap = new Map<string, DashboardGroupRow>();

  for (const row of dailyRows) {
    const key = row.date.toISOString().slice(0, 10);
    const point = seriesMap.get(key);

    if (point) {
      point.visits += row.totalVisits;
      point.appleStoreClicks += row.appleStoreClicks;
      point.playStoreClicks += row.playStoreClicks;
    }

    upsertGroupRow(influencerMap, row.influencer, row);
    upsertGroupRow(campaignMap, row.campaign, row);
    upsertGroupRow(sourceMap, row.source, row);
  }

  const totalInfluencers = influencerMap.size;
  const totalCampaigns = campaignMap.size;
  const topLinks: DashboardLinkRow[] = linkRows.map((link) => ({
    id: link.id,
    slug: link.slug,
    name: link.name,
    publicUrl: buildPublicTrackingUrl(link.slug, link.trackingLink?.landingPath ?? "/"),
    source: link.source,
    campaign: link.campaign,
    influencer: link.influencer,
    totalVisits: link.totalVisits,
    appleStoreClicks: link.appleStoreClicks,
    playStoreClicks: link.playStoreClicks,
    conversionRate: link.conversionRate,
  }));

  return {
    mode: "aggregate",
    rangeDays,
    overview: buildOverview(
      {
        totalVisits: overviewRow?.totalVisits ?? 0,
        appleStoreClicks: overviewRow?.appleStoreClicks ?? 0,
        playStoreClicks: overviewRow?.playStoreClicks ?? 0,
      },
      {
        totalLinks,
        totalInfluencers,
        totalCampaigns,
        lastUpdatedAt: overviewRow?.generatedAt.toISOString() ?? null,
      },
    ),
    series: [...seriesMap.values()],
    topLinks,
    topInfluencers: sortGroupRows(influencerMap),
    topCampaigns: sortGroupRows(campaignMap),
    topSources: sortGroupRows(sourceMap),
  };
}

async function getRealtimeDashboard(rangeDays: number): Promise<UtmDashboardData> {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (rangeDays - 1));
  start.setUTCHours(0, 0, 0, 0);

  const [visits, events, totalLinks] = await Promise.all([
    utmPrisma.pageVisit.findMany({
      where: {
        createdAt: {
          gte: start,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        createdAt: true,
        source: true,
        campaign: true,
        influencer: true,
        trackingLink: {
          select: {
            id: true,
            slug: true,
            name: true,
            landingPath: true,
            source: true,
            campaign: true,
            influencer: true,
          },
        },
      },
    }),
    utmPrisma.pageEvent.findMany({
      where: {
        createdAt: {
          gte: start,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        createdAt: true,
        eventType: true,
        source: true,
        campaign: true,
        influencer: true,
        trackingLink: {
          select: {
            id: true,
            slug: true,
            name: true,
            landingPath: true,
            source: true,
            campaign: true,
            influencer: true,
          },
        },
      },
    }),
    utmPrisma.trackingLink.count(),
  ]);

  const seriesMap = toDashboardPointMap(rangeDays);
  const linkMap = new Map<string, DashboardLinkRow>();
  const influencerMap = new Map<string, DashboardGroupRow>();
  const campaignMap = new Map<string, DashboardGroupRow>();
  const sourceMap = new Map<string, DashboardGroupRow>();

  for (const visit of visits) {
    const key = visit.createdAt.toISOString().slice(0, 10);
    const point = seriesMap.get(key);

    if (point) {
      point.visits += 1;
    }

    upsertGroupRow(influencerMap, visit.influencer, { totalVisits: 1 });
    upsertGroupRow(campaignMap, visit.campaign, { totalVisits: 1 });
    upsertGroupRow(sourceMap, visit.source, { totalVisits: 1 });

    if (visit.trackingLink) {
      const current = linkMap.get(visit.trackingLink.id) ?? {
        id: visit.trackingLink.id,
        slug: visit.trackingLink.slug,
        name: visit.trackingLink.name,
        publicUrl: buildPublicTrackingUrl(visit.trackingLink.slug, visit.trackingLink.landingPath),
        source: visit.trackingLink.source,
        campaign: visit.trackingLink.campaign,
        influencer: visit.trackingLink.influencer,
        totalVisits: 0,
        appleStoreClicks: 0,
        playStoreClicks: 0,
        conversionRate: 0,
      };

      current.totalVisits += 1;
      linkMap.set(visit.trackingLink.id, current);
    }
  }

  for (const event of events) {
    const key = event.createdAt.toISOString().slice(0, 10);
    const point = seriesMap.get(key);

    if (point && event.eventType === EventType.APPLE_STORE_CLICK) {
      point.appleStoreClicks += 1;
    }

    if (point && event.eventType === EventType.PLAY_STORE_CLICK) {
      point.playStoreClicks += 1;
    }

    upsertGroupRow(influencerMap, event.influencer, {
      appleStoreClicks: event.eventType === EventType.APPLE_STORE_CLICK ? 1 : 0,
      playStoreClicks: event.eventType === EventType.PLAY_STORE_CLICK ? 1 : 0,
    });
    upsertGroupRow(campaignMap, event.campaign, {
      appleStoreClicks: event.eventType === EventType.APPLE_STORE_CLICK ? 1 : 0,
      playStoreClicks: event.eventType === EventType.PLAY_STORE_CLICK ? 1 : 0,
    });
    upsertGroupRow(sourceMap, event.source, {
      appleStoreClicks: event.eventType === EventType.APPLE_STORE_CLICK ? 1 : 0,
      playStoreClicks: event.eventType === EventType.PLAY_STORE_CLICK ? 1 : 0,
    });

    if (event.trackingLink) {
      const current = linkMap.get(event.trackingLink.id) ?? {
        id: event.trackingLink.id,
        slug: event.trackingLink.slug,
        name: event.trackingLink.name,
        publicUrl: buildPublicTrackingUrl(event.trackingLink.slug, event.trackingLink.landingPath),
        source: event.trackingLink.source,
        campaign: event.trackingLink.campaign,
        influencer: event.trackingLink.influencer,
        totalVisits: 0,
        appleStoreClicks: 0,
        playStoreClicks: 0,
        conversionRate: 0,
      };

      if (event.eventType === EventType.APPLE_STORE_CLICK) {
        current.appleStoreClicks += 1;
      }

      if (event.eventType === EventType.PLAY_STORE_CLICK) {
        current.playStoreClicks += 1;
      }

      current.conversionRate =
        current.totalVisits > 0
          ? Number((((current.appleStoreClicks + current.playStoreClicks) / current.totalVisits) * 100).toFixed(1))
          : 0;

      linkMap.set(event.trackingLink.id, current);
    }
  }

  const lastUpdatedAt = [...visits.map((visit) => visit.createdAt), ...events.map((event) => event.createdAt)]
    .sort((left, right) => right.getTime() - left.getTime())[0]
    ?.toISOString() ?? null;

  return {
    mode: "realtime",
    rangeDays,
    overview: buildOverview(
      {
        totalVisits: visits.length,
        appleStoreClicks: events.filter((event) => event.eventType === EventType.APPLE_STORE_CLICK).length,
        playStoreClicks: events.filter((event) => event.eventType === EventType.PLAY_STORE_CLICK).length,
      },
      {
        totalLinks,
        totalInfluencers: influencerMap.size,
        totalCampaigns: campaignMap.size,
        lastUpdatedAt,
      },
    ),
    series: [...seriesMap.values()],
    topLinks: [...linkMap.values()]
      .sort((left, right) => right.totalVisits - left.totalVisits)
      .slice(0, 12),
    topInfluencers: sortGroupRows(influencerMap),
    topCampaigns: sortGroupRows(campaignMap),
    topSources: sortGroupRows(sourceMap),
  };
}

export async function getDashboardData(input?: DashboardQueryInput) {
  const mode = dashboardModeSchema.parse(input?.mode ?? "aggregate");
  const rangeDays = normalizeRangeDays(input?.rangeDays);

  if (mode === "realtime") {
    return getRealtimeDashboard(rangeDays);
  }

  return getAggregateDashboard(rangeDays);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderTable(title: string, headers: string[], rows: string[][]) {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
    .join("");

  return `
    <h2>${escapeHtml(title)}</h2>
    <table border="1">
      <thead>
        <tr>${head}</tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  `;
}

export async function buildDashboardExcelDocument(input?: DashboardQueryInput) {
  const data = await getDashboardData(input);

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; margin-bottom: 24px; width: 100%; }
          th, td { padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h1, h2 { margin: 16px 0 8px; }
        </style>
      </head>
      <body>
        <h1>Relatório UTM (${escapeHtml(data.mode)})</h1>
        ${renderTable("Resumo", ["Métrica", "Valor"], [
    ["Visitas totais", data.overview.totalVisits.toLocaleString("pt-BR")],
    ["Cliques Apple Store", data.overview.appleStoreClicks.toLocaleString("pt-BR")],
    ["Cliques Play Store", data.overview.playStoreClicks.toLocaleString("pt-BR")],
    ["Conversão", `${data.overview.conversionRate.toFixed(1)}%`],
    ["Links ativos", data.overview.totalLinks.toLocaleString("pt-BR")],
    ["Influenciadores", data.overview.totalInfluencers.toLocaleString("pt-BR")],
    ["Campanhas", data.overview.totalCampaigns.toLocaleString("pt-BR")],
  ])}
        ${renderTable(
    "Série diária",
    ["Data", "Visitas", "Apple Store", "Play Store"],
    data.series.map((point) => [
      point.date,
      point.visits.toLocaleString("pt-BR"),
      point.appleStoreClicks.toLocaleString("pt-BR"),
      point.playStoreClicks.toLocaleString("pt-BR"),
    ]),
  )}
        ${renderTable(
    "Links",
    ["Nome", "Slug", "Origem", "Campanha", "Influenciador", "Visitas", "Apple", "Play", "Conversão"],
    data.topLinks.map((row) => [
      row.name,
      row.slug,
      row.source,
      row.campaign ?? "-",
      row.influencer ?? "-",
      row.totalVisits.toLocaleString("pt-BR"),
      row.appleStoreClicks.toLocaleString("pt-BR"),
      row.playStoreClicks.toLocaleString("pt-BR"),
      `${row.conversionRate.toFixed(1)}%`,
    ]),
  )}
      </body>
    </html>
  `;

  return html;
}

export type TrackingLinkListItem = {
  id: string;
  name: string;
  slug: string;
  publicUrl: string;
  source: string;
  campaign: string | null;
  influencer: string | null;
  landingPath: string;
  isActive: boolean;
  createdAt: Date;
};

export type ListTrackingLinksInput = {
  page?: number;
  pageSize?: number;
};

export type ListTrackingLinksResult = {
  items: TrackingLinkListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listTrackingLinks(input?: ListTrackingLinksInput): Promise<ListTrackingLinksResult> {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input?.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    utmPrisma.trackingLink.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        source: true,
        campaign: true,
        influencer: true,
        landingPath: true,
        isActive: true,
        createdAt: true,
      },
    }),
    utmPrisma.trackingLink.count(),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      publicUrl: buildPublicTrackingUrl(item.slug, item.landingPath),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
