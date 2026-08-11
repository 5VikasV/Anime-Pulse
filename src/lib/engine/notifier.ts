import { prisma } from "@/lib/prisma";
import { sendNtfy } from "@/lib/notifications";
import { decryptSecret } from "@/lib/secrets";

export async function processNotificationWorker() {
  const now = new Date();

  // Find confirmed ReleaseEvents
  const releaseEvents = await prisma.releaseEvent.findMany({
    include: {
      episode: {
        include: {
          anime: true,
        },
      },
      provider: true,
    },
    take: 50,
  });

  const deliveryResults = [];

  for (const event of releaseEvents) {
    // Find active user follows for this anime
    const follows = await prisma.follow.findMany({
      where: {
        animeId: event.episode.animeId,
        enabled: true,
      },
      include: {
        user: {
          include: {
            notificationEndpoints: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    for (const follow of follows) {
      // SOLE SOURCE OF TRUTH for ntfy topic: NotificationEndpoint
      const endpoints = follow.user.notificationEndpoints;

      for (const endpoint of endpoints) {
        const idempotencyKey = `${event.id}:${follow.id}:${endpoint.id}`;

        // Find or create NotificationDelivery record with unique constraint
        let delivery = await prisma.notificationDelivery.findUnique({
          where: { idempotencyKey },
        });

        if (delivery && delivery.status === "SENT") {
          continue; // Already successfully delivered
        }

        if (
          delivery &&
          delivery.status === "FAILED" &&
          delivery.nextRetryAt &&
          delivery.nextRetryAt > now
        ) {
          continue; // Waiting for backoff retry window
        }

        if (!delivery) {
          try {
            delivery = await prisma.notificationDelivery.create({
              data: {
                releaseEventId: event.id,
                followId: follow.id,
                endpointId: endpoint.id,
                status: "PENDING",
                idempotencyKey,
              },
            });
          } catch {
            // Unique constraint race condition safety
            delivery = await prisma.notificationDelivery.findUnique({
              where: { idempotencyKey },
            });
            if (!delivery || delivery.status === "SENT") continue;
          }
        }

        // Fetch watchUrl from EpisodeAvailability
        const avail = await prisma.episodeAvailability.findUnique({
          where: {
            episodeId_providerId_region: {
              episodeId: event.episodeId,
              providerId: event.providerId,
              region: event.region,
            },
          },
        });

        const animeTitle = event.episode.anime.titleEnglish ?? event.episode.anime.title;
        const episodeNum = event.episode.episodeNumber;
        const providerName = event.provider.name;
        const watchUrlStr = avail?.watchUrl ? `\nWatch: ${avail.watchUrl}` : "";

        const messageBody = `⚡ Episode ${episodeNum} of ${animeTitle} is OUT NOW on ${providerName}!${watchUrlStr}`;

        let sentSuccess = false;
        let responseDiagnostic = "";

        try {
          const decryptedTopic = decryptSecret(endpoint.ntfyTopic);
          await sendNtfy(decryptedTopic, "AnimePulse Release Alert", messageBody, "clapper");
          sentSuccess = true;
          responseDiagnostic = "Delivered to ntfy endpoint";
        } catch (err) {
          sentSuccess = false;
          responseDiagnostic = err instanceof Error ? err.message : "ntfy delivery failed";
        }

        const nextAttemptCount = delivery.attemptCount + 1;

        if (sentSuccess) {
          await prisma.notificationDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "SENT",
              sentAt: now,
              attemptCount: nextAttemptCount,
              providerResponse: responseDiagnostic,
            },
          });
          deliveryResults.push({ deliveryId: delivery.id, status: "SENT" });
        } else {
          // Exponential backoff: 5m, 10m, 20m, etc.
          const backoffMinutes = 5 * Math.pow(2, Math.min(nextAttemptCount - 1, 5));
          const nextRetryAt = new Date(now.getTime() + backoffMinutes * 60 * 1000);

          await prisma.notificationDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "FAILED",
              failedAt: now,
              attemptCount: nextAttemptCount,
              nextRetryAt,
              providerResponse: responseDiagnostic,
            },
          });
          deliveryResults.push({ deliveryId: delivery.id, status: "FAILED", nextRetryAt });
        }
      }
    }
  }

  return deliveryResults;
}
