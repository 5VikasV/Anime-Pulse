import { prisma } from "../src/lib/prisma";
import { syncAnimeSchedule } from "../src/lib/engine/scheduler";
import { detectEpisodeReleases } from "../src/lib/engine/detector";
import { processNotificationWorker } from "../src/lib/engine/notifier";

async function runOneShotScheduler() {
  console.log(`[${new Date().toISOString()}] Starting AnimePulse One-Shot Release Pipeline Scheduler...`);

  // 1. AniList schedule synchronization for followed active anime
  try {
    const activeFollows = await prisma.follow.findMany({
      where: { enabled: true },
      include: { anime: true },
    });

    const uniqueAnilistIds = Array.from(new Set(activeFollows.map((f) => f.anime.anilistId)));
    console.log(`Synchronizing schedule for ${uniqueAnilistIds.length} active anime...`);

    for (const anilistId of uniqueAnilistIds) {
      await syncAnimeSchedule(anilistId).catch((err) => {
        console.error(`Failed to sync schedule for AniList ID ${anilistId}:`, err);
      });
    }
  } catch (err) {
    console.error("Schedule sync step failed:", err);
  }

  // 2. Release detection for post-airing candidate episodes
  let detections: Array<unknown> = [];
  try {
    console.log("Executing release detection...");
    detections = await detectEpisodeReleases({
      providerIdentifier: "watchmode",
      region: "IN",
    });
    console.log(`Release detection completed: ${detections.length} candidate episodes checked.`);
  } catch (err) {
    console.error("Release detection step failed:", err);
  }

  // 3. Notification delivery worker
  let deliveries: Array<unknown> = [];
  try {
    console.log("Executing notification delivery worker...");
    deliveries = await processNotificationWorker();
    console.log(`Notification worker completed: ${deliveries.length} delivery attempts processed.`);
  } catch (err) {
    console.error("Notification worker step failed:", err);
  }

  console.log(`[${new Date().toISOString()}] AnimePulse Scheduler completed successfully.`);
  process.exit(0);
}

runOneShotScheduler().catch((err) => {
  console.error("Fatal scheduler error:", err);
  process.exit(1);
});
