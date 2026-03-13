-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('APPLE_STORE_CLICK', 'PLAY_STORE_CLICK');

-- CreateTable
CREATE TABLE "TrackingLink" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "landingPath" TEXT NOT NULL DEFAULT '/',
    "source" TEXT NOT NULL DEFAULT 'direct',
    "medium" TEXT,
    "campaign" TEXT,
    "term" TEXT,
    "content" TEXT,
    "influencer" TEXT,
    "platform" TEXT,
    "creativeLabel" TEXT,
    "creativeType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVisit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "trackingLinkId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "medium" TEXT,
    "campaign" TEXT,
    "term" TEXT,
    "content" TEXT,
    "influencer" TEXT,
    "platform" TEXT,
    "creativeLabel" TEXT,
    "creativeType" TEXT,
    "pagePath" TEXT NOT NULL DEFAULT '/',
    "referrer" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,

    CONSTRAINT "PageVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" "EventType" NOT NULL,
    "sessionId" TEXT NOT NULL,
    "pageVisitId" TEXT,
    "trackingLinkId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "campaign" TEXT,
    "influencer" TEXT,
    "creativeLabel" TEXT,
    "destination" TEXT,
    "metadata" JSONB,

    CONSTRAINT "PageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateCursor" (
    "id" TEXT NOT NULL,
    "lastProcessedVisitCreatedAt" TIMESTAMP(3),
    "lastProcessedVisitId" TEXT,
    "lastProcessedEventCreatedAt" TIMESTAMP(3),
    "lastProcessedEventId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AggregateCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateOverview" (
    "id" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "appleStoreClicks" INTEGER NOT NULL DEFAULT 0,
    "playStoreClicks" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),

    CONSTRAINT "AggregateOverview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateDaily" (
    "id" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "trackingLinkId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "campaign" TEXT,
    "influencer" TEXT,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "appleStoreClicks" INTEGER NOT NULL DEFAULT 0,
    "playStoreClicks" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AggregateDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateLink" (
    "id" TEXT NOT NULL,
    "trackingLinkId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'direct',
    "campaign" TEXT,
    "influencer" TEXT,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "appleStoreClicks" INTEGER NOT NULL DEFAULT 0,
    "playStoreClicks" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "lastAggregatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AggregateLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackingLink_slug_key" ON "TrackingLink"("slug");

-- CreateIndex
CREATE INDEX "TrackingLink_source_idx" ON "TrackingLink"("source");

-- CreateIndex
CREATE INDEX "TrackingLink_campaign_idx" ON "TrackingLink"("campaign");

-- CreateIndex
CREATE INDEX "TrackingLink_influencer_idx" ON "TrackingLink"("influencer");

-- CreateIndex
CREATE INDEX "PageVisit_createdAt_idx" ON "PageVisit"("createdAt");

-- CreateIndex
CREATE INDEX "PageVisit_sessionId_idx" ON "PageVisit"("sessionId");

-- CreateIndex
CREATE INDEX "PageVisit_trackingLinkId_idx" ON "PageVisit"("trackingLinkId");

-- CreateIndex
CREATE INDEX "PageVisit_source_idx" ON "PageVisit"("source");

-- CreateIndex
CREATE INDEX "PageVisit_campaign_idx" ON "PageVisit"("campaign");

-- CreateIndex
CREATE INDEX "PageVisit_influencer_idx" ON "PageVisit"("influencer");

-- CreateIndex
CREATE INDEX "PageEvent_createdAt_idx" ON "PageEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PageEvent_eventType_idx" ON "PageEvent"("eventType");

-- CreateIndex
CREATE INDEX "PageEvent_sessionId_idx" ON "PageEvent"("sessionId");

-- CreateIndex
CREATE INDEX "PageEvent_trackingLinkId_idx" ON "PageEvent"("trackingLinkId");

-- CreateIndex
CREATE INDEX "PageEvent_source_idx" ON "PageEvent"("source");

-- CreateIndex
CREATE INDEX "PageEvent_campaign_idx" ON "PageEvent"("campaign");

-- CreateIndex
CREATE INDEX "PageEvent_influencer_idx" ON "PageEvent"("influencer");

-- CreateIndex
CREATE UNIQUE INDEX "AggregateDaily_bucketKey_key" ON "AggregateDaily"("bucketKey");

-- CreateIndex
CREATE INDEX "AggregateDaily_date_idx" ON "AggregateDaily"("date");

-- CreateIndex
CREATE INDEX "AggregateDaily_trackingLinkId_idx" ON "AggregateDaily"("trackingLinkId");

-- CreateIndex
CREATE INDEX "AggregateDaily_source_idx" ON "AggregateDaily"("source");

-- CreateIndex
CREATE INDEX "AggregateDaily_campaign_idx" ON "AggregateDaily"("campaign");

-- CreateIndex
CREATE INDEX "AggregateDaily_influencer_idx" ON "AggregateDaily"("influencer");

-- CreateIndex
CREATE UNIQUE INDEX "AggregateLink_trackingLinkId_key" ON "AggregateLink"("trackingLinkId");

-- CreateIndex
CREATE INDEX "AggregateLink_slug_idx" ON "AggregateLink"("slug");

-- CreateIndex
CREATE INDEX "AggregateLink_source_idx" ON "AggregateLink"("source");

-- CreateIndex
CREATE INDEX "AggregateLink_campaign_idx" ON "AggregateLink"("campaign");

-- CreateIndex
CREATE INDEX "AggregateLink_influencer_idx" ON "AggregateLink"("influencer");

-- AddForeignKey
ALTER TABLE "PageVisit" ADD CONSTRAINT "PageVisit_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "TrackingLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageEvent" ADD CONSTRAINT "PageEvent_pageVisitId_fkey" FOREIGN KEY ("pageVisitId") REFERENCES "PageVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageEvent" ADD CONSTRAINT "PageEvent_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "TrackingLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateDaily" ADD CONSTRAINT "AggregateDaily_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "TrackingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateLink" ADD CONSTRAINT "AggregateLink_trackingLinkId_fkey" FOREIGN KEY ("trackingLinkId") REFERENCES "TrackingLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
