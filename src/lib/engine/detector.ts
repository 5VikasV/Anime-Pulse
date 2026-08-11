import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/providers";

export async function detectEpisodeReleases(options?: {
  providerIdentifier?: string;
  region?: string;
}) {
  const providerIdentifier = options?.providerIdentifier ?? "watchmode";
  const region = options?.region ?? "IN";

  // Ensure default provider record exists in database
  const providerDef = getProvider(providerIdentifier);
  const provider = await prisma.streamingProvider.upsert({
    where: { identifier: providerDef.id },
    update: { name: providerDef.name },
    create: {
      identifier: providerDef.id,
      name: providerDef.name,
      supportedRegions: providerDef.supportedRegions.join(","),
    },
  });

  const now = new Date();

  // Find candidate episodes that have passed scheduled airing time
  // and do NOT yet have a confirmed ReleaseEvent for this provider + region
  const candidateEpisodes = await prisma.episode.findMany({
    where: {
      scheduledAiringAt: { lte: now },
      releaseEvents: {
        none: {
          providerId: provider.id,
          region,
        },
      },
    },
    include: {
      anime: {
        include: {
          mappings: {
            where: { providerId: provider.id },
          },
        },
      },
      availabilities: {
        where: { providerId: provider.id, region },
      },
    },
    take: 50,
  });

  const results = [];

  for (const episode of candidateEpisodes) {
    const { anime } = episode;

    // 1. Resolve or find provider external ID mapping
    let externalId: string | undefined = anime.mappings[0]?.providerExternalId;
    if (!externalId) {
      externalId = (await providerDef.findTitleMapping({
        anilistId: anime.anilistId,
        title: anime.title,
        titleEnglish: anime.titleEnglish,
        malId: anime.malId,
      })) ?? undefined;

      if (externalId) {
        await prisma.providerAnimeMapping.upsert({
          where: {
            animeId_providerId: {
              animeId: anime.id,
              providerId: provider.id,
            },
          },
          update: { providerExternalId: externalId },
          create: {
            animeId: anime.id,
            providerId: provider.id,
            providerExternalId: externalId,
          },
        });
      }
    }

    if (!externalId) {
      // Record NOT_FOUND availability state
      await prisma.episodeAvailability.upsert({
        where: {
          episodeId_providerId_region: {
            episodeId: episode.id,
            providerId: provider.id,
            region,
          },
        },
        update: {
          status: "NOT_FOUND",
          checkedAt: now,
          sourceReference: "NO_PROVIDER_MAPPING",
        },
        create: {
          episodeId: episode.id,
          providerId: provider.id,
          region,
          status: "NOT_FOUND",
          checkedAt: now,
          sourceReference: "NO_PROVIDER_MAPPING",
        },
      });

      results.push({ episodeId: episode.id, status: "NOT_FOUND", releaseCreated: false });
      continue;
    }

    // 2. Perform episode availability check via provider
    const checkResult = await providerDef.checkEpisodeAvailability({
      providerExternalId: externalId,
      episodeNumber: episode.episodeNumber,
      region,
    });

    const isAvailable = checkResult.status === "AVAILABLE";

    // 3. Upsert EpisodeAvailability record
    const existingAvail = episode.availabilities[0];
    const firstConfirmedAt = isAvailable
      ? existingAvail?.firstConfirmedAt ?? now
      : existingAvail?.firstConfirmedAt ?? null;
    const lastConfirmedAt = isAvailable ? now : existingAvail?.lastConfirmedAt ?? null;

    await prisma.episodeAvailability.upsert({
      where: {
        episodeId_providerId_region: {
          episodeId: episode.id,
          providerId: provider.id,
          region,
        },
      },
      update: {
        status: checkResult.status,
        checkedAt: now,
        firstConfirmedAt,
        lastConfirmedAt,
        sourceReference: checkResult.sourceReference,
        watchUrl: checkResult.watchUrl,
      },
      create: {
        episodeId: episode.id,
        providerId: provider.id,
        region,
        status: checkResult.status,
        checkedAt: now,
        firstConfirmedAt,
        lastConfirmedAt,
        sourceReference: checkResult.sourceReference,
        watchUrl: checkResult.watchUrl,
      },
    });

    let releaseCreated = false;

    // 4. CRITICAL RULE: ONLY create ReleaseEvent if provider status is AVAILABLE
    if (isAvailable) {
      try {
        await prisma.releaseEvent.create({
          data: {
            episodeId: episode.id,
            providerId: provider.id,
            region,
            detectedAt: now,
          },
        });
        releaseCreated = true;
      } catch {
        // Unique constraint violation if already created
        releaseCreated = false;
      }
    }

    results.push({
      episodeId: episode.id,
      status: checkResult.status,
      releaseCreated,
    });
  }

  return results;
}
