import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendNtfy } from "@/lib/notifications";
import { hasSameOrigin, readJson, RequestError } from "@/lib/request-security";
import { decryptSecret } from "@/lib/secrets";
import { addReminderSchema } from "@/lib/validation";
import { syncAnimeSchedule } from "@/lib/engine/scheduler";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  });

  return NextResponse.json({ reminders });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
    throw error;
  }
  const parsed = addReminderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid anime" }, { status: 400 });

  const { anime, episode } = await syncAnimeSchedule(parsed.data.anilistId);

  const existing = await prisma.follow.findUnique({
    where: {
      userId_animeId: {
        userId: session.user.id,
        animeId: anime.id,
      },
    },
  });

  const follow = existing
    ? await prisma.follow.update({ where: { id: existing.id }, data: { enabled: true } })
    : await prisma.follow.create({
        data: {
          userId: session.user.id,
          animeId: anime.id,
          enabled: true,
        },
      });

  let testNotification: "sent" | "failed" = "sent";
  if (!existing) {
    const endpoint = await prisma.notificationEndpoint.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
    });

    if (endpoint) {
      try {
        await sendNtfy(
          decryptSecret(endpoint.ntfyTopic),
          "AnimePulse",
          `🎬 ${anime.title} added to AnimePulse lineup. Episode alerts will arrive when confirmed available!`,
          "tada"
        );
      } catch {
        testNotification = "failed";
      }
    }
  }

  const reminder = {
    id: follow.id,
    userId: follow.userId,
    anilistId: anime.anilistId,
    malId: anime.malId,
    title: anime.title,
    titleEnglish: anime.titleEnglish,
    imageUrl: anime.imageUrl,
    nextEpisode: episode?.episodeNumber ?? 1,
    nextAiringAt: episode?.scheduledAiringAt ?? new Date(),
    totalEpisodes: anime.totalEpisodes,
    enabled: follow.enabled,
    isAvailable: false,
    streamingUrl: null,
  };

  return NextResponse.json({ reminder, testNotification }, { status: 201 });
}

