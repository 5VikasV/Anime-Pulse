import { prisma } from "@/lib/prisma";
import { getAnime } from "@/lib/anilist";

export async function syncAnimeSchedule(anilistId: number) {
  const animeData = await getAnime(anilistId);

  const anime = await prisma.anime.upsert({
    where: { anilistId: animeData.anilistId },
    update: {
      title: animeData.title,
      titleEnglish: animeData.titleEnglish,
      imageUrl: animeData.imageUrl,
      totalEpisodes: animeData.episodes,
      status: animeData.status,
      syncedAt: new Date(),
    },
    create: {
      anilistId: animeData.anilistId,
      malId: animeData.malId,
      title: animeData.title,
      titleEnglish: animeData.titleEnglish,
      imageUrl: animeData.imageUrl,
      totalEpisodes: animeData.episodes,
      status: animeData.status,
    },
  });

  let episode = null;
  if (animeData.nextEpisode && animeData.nextAiringAt) {
    const scheduledAiringAt = new Date(animeData.nextAiringAt);
    if (!isNaN(scheduledAiringAt.getTime())) {
      episode = await prisma.episode.upsert({
        where: {
          animeId_episodeNumber: {
            animeId: anime.id,
            episodeNumber: animeData.nextEpisode,
          },
        },
        update: {
          scheduledAiringAt,
        },
        create: {
          animeId: anime.id,
          episodeNumber: animeData.nextEpisode,
          scheduledAiringAt,
          scheduleSource: "ANILIST",
        },
      });
    }
  }

  return { anime, episode };
}
