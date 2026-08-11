-- AlterTable
ALTER TABLE "User" ADD COLUMN "region" TEXT NOT NULL DEFAULT 'IN',
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- CreateTable
CREATE TABLE "NotificationEndpoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ntfyTopic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anime" (
    "id" TEXT NOT NULL,
    "anilistId" INTEGER NOT NULL,
    "malId" INTEGER,
    "title" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "imageUrl" TEXT NOT NULL,
    "totalEpisodes" INTEGER,
    "status" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAnimeMapping" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerExternalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAnimeMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "scheduledAiringAt" TIMESTAMP(3),
    "anilistAiringId" INTEGER,
    "scheduleSource" TEXT NOT NULL DEFAULT 'ANILIST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamingProvider" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supportedRegions" TEXT NOT NULL DEFAULT 'US,IN,GB',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreamingProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EpisodeAvailability" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstConfirmedAt" TIMESTAMP(3),
    "lastConfirmedAt" TIMESTAMP(3),
    "sourceReference" TEXT,
    "watchUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EpisodeAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReleaseEvent" (
    "id" TEXT NOT NULL,
    "episodeId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReleaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "releaseEventId" TEXT NOT NULL,
    "followId" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "providerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "NotificationEndpoint_userId_idx" ON "NotificationEndpoint"("userId");
CREATE UNIQUE INDEX "Anime_anilistId_key" ON "Anime"("anilistId");
CREATE UNIQUE INDEX "ProviderAnimeMapping_animeId_providerId_key" ON "ProviderAnimeMapping"("animeId", "providerId");
CREATE INDEX "Episode_scheduledAiringAt_idx" ON "Episode"("scheduledAiringAt");
CREATE UNIQUE INDEX "Episode_animeId_episodeNumber_key" ON "Episode"("animeId", "episodeNumber");
CREATE UNIQUE INDEX "Follow_userId_animeId_key" ON "Follow"("userId", "animeId");
CREATE UNIQUE INDEX "StreamingProvider_identifier_key" ON "StreamingProvider"("identifier");
CREATE INDEX "EpisodeAvailability_status_checkedAt_idx" ON "EpisodeAvailability"("status", "checkedAt");
CREATE UNIQUE INDEX "EpisodeAvailability_episodeId_providerId_region_key" ON "EpisodeAvailability"("episodeId", "providerId", "region");
CREATE UNIQUE INDEX "ReleaseEvent_episodeId_providerId_region_key" ON "ReleaseEvent"("episodeId", "providerId", "region");
CREATE UNIQUE INDEX "NotificationDelivery_idempotencyKey_key" ON "NotificationDelivery"("idempotencyKey");
CREATE INDEX "NotificationDelivery_status_nextRetryAt_idx" ON "NotificationDelivery"("status", "nextRetryAt");
CREATE INDEX "NotificationDelivery_releaseEventId_idx" ON "NotificationDelivery"("releaseEventId");
CREATE INDEX "NotificationDelivery_followId_idx" ON "NotificationDelivery"("followId");

-- AddForeignKeys
ALTER TABLE "NotificationEndpoint" ADD CONSTRAINT "NotificationEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderAnimeMapping" ADD CONSTRAINT "ProviderAnimeMapping_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderAnimeMapping" ADD CONSTRAINT "ProviderAnimeMapping_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "StreamingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_preferredProviderId_fkey" FOREIGN KEY ("preferredProviderId") REFERENCES "StreamingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EpisodeAvailability" ADD CONSTRAINT "EpisodeAvailability_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EpisodeAvailability" ADD CONSTRAINT "EpisodeAvailability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "StreamingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseEvent" ADD CONSTRAINT "ReleaseEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReleaseEvent" ADD CONSTRAINT "ReleaseEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "StreamingProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_releaseEventId_fkey" FOREIGN KEY ("releaseEventId") REFERENCES "ReleaseEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_followId_fkey" FOREIGN KEY ("followId") REFERENCES "Follow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "NotificationEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
