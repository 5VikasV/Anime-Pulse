import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function migrateLegacyData() {
  console.log("Checking legacy data...");
  
  // Check if legacy User table has ntfyTopic
  const users = await prisma.$queryRawUnsafe<Array<{ id: string; ntfyTopic?: string }>>(
    `SELECT id, "ntfyTopic" FROM "User"`
  ).catch(() => []);

  let endpointCount = 0;
  for (const user of users) {
    if (user.ntfyTopic) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "NotificationEndpoint" (id, "userId", "ntfyTopic", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        `endpoint_${user.id}`,
        user.id,
        user.ntfyTopic
      );
      endpointCount++;
    }
  }

  // Check if AnimeReminder table exists
  const reminders = await prisma.$queryRawUnsafe<Array<{
    id: string;
    userId: string;
    anilistId: number | null;
    malId: number | null;
    title: string;
    titleEnglish: string | null;
    imageUrl: string;
    nextEpisode: number;
    nextAiringAt: Date;
    totalEpisodes: number | null;
    enabled: boolean;
  }>>(`SELECT * FROM "AnimeReminder"`).catch(() => []);

  let animeCount = 0;
  let followCount = 0;

  for (const r of reminders) {
    if (!r.anilistId) continue;

    const animeId = `anime_${r.anilistId}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Anime" (id, "anilistId", "malId", title, "titleEnglish", "imageUrl", "totalEpisodes", "syncedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
       ON CONFLICT ("anilistId") DO UPDATE SET title = EXCLUDED.title`,
      animeId,
      r.anilistId,
      r.malId,
      r.title,
      r.titleEnglish,
      r.imageUrl,
      r.totalEpisodes
    );
    animeCount++;

    const episodeId = `ep_${animeId}_${r.nextEpisode}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Episode" (id, "animeId", "episodeNumber", "scheduledAiringAt", "scheduleSource", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'ANILIST', NOW(), NOW())
       ON CONFLICT ("animeId", "episodeNumber") DO UPDATE SET "scheduledAiringAt" = EXCLUDED."scheduledAiringAt"`,
      episodeId,
      animeId,
      r.nextEpisode,
      r.nextAiringAt
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Follow" (id, "userId", "animeId", enabled, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT ("userId", "animeId") DO NOTHING`,
      `follow_${r.userId}_${animeId}`,
      r.userId,
      animeId,
      r.enabled
    );
    followCount++;
  }

  console.log(`Migrated ${endpointCount} endpoints, ${animeCount} anime, ${followCount} follows.`);
  return { endpointCount, animeCount, followCount };
}

if (require.main === module) {
  migrateLegacyData()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
}
