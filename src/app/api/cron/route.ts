import { NextResponse } from "next/server";
import { detectEpisodeReleases, processNotificationWorker } from "@/lib/engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Run release detector for post-airing candidate episodes
  const detectionResults = await detectEpisodeReleases({
    providerIdentifier: "watchmode",
    region: "IN",
  });

  // 2. Run notification worker for confirmed ReleaseEvents
  const deliveryResults = await processNotificationWorker();

  return NextResponse.json({
    ok: true,
    detections: detectionResults.length,
    deliveries: deliveryResults.length,
    details: {
      detectionResults,
      deliveryResults,
    },
  });
}

