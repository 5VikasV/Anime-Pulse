import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Dashboard } from "@/components/dashboard";
import type { AnimeReminder } from "@/types/anime";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const follows = await prisma.follow.findMany({
    where: { userId: session.user.id },
    include: {
      anime: {
        include: {
          episodes: {
            orderBy: { episodeNumber: "desc" },
            take: 1,
            include: {
              availabilities: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const reminders = follows.map((follow) => {
    const latestEp = follow.anime.episodes[0];
    const avail = latestEp?.availabilities[0];
    return {
      id: follow.id,
      userId: follow.userId,
      anilistId: follow.anime.anilistId,
      malId: follow.anime.malId,
      title: follow.anime.title,
      titleEnglish: follow.anime.titleEnglish,
      imageUrl: follow.anime.imageUrl,
      nextEpisode: latestEp?.episodeNumber ?? 1,
      nextAiringAt: latestEp?.scheduledAiringAt ?? new Date(),
      totalEpisodes: follow.anime.totalEpisodes,
      enabled: follow.enabled,
      isAvailable: avail?.status === "AVAILABLE",
      streamingUrl: avail?.watchUrl ?? null,
    };
  }) as unknown as AnimeReminder[];

  return <Dashboard initialReminders={reminders} email={session.user.email ?? ""} />;
}

