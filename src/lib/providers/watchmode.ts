import type {
  AnimeSearchQuery,
  CheckAvailabilityParams,
  ProviderCheckResult,
  StreamingAvailabilityProvider,
} from "./types";

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";

export class WatchmodeProvider implements StreamingAvailabilityProvider {
  readonly id = "watchmode";
  readonly name = "Watchmode";
  readonly supportedRegions = ["US", "IN", "GB", "CA", "AU"];

  private get apiKey(): string {
    return process.env.WATCHMODE_API_KEY ?? "";
  }

  async findTitleMapping(query: AnimeSearchQuery): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    const searchTerm = query.titleEnglish ?? query.title;
    try {
      const url = `${WATCHMODE_BASE_URL}/search/?apiKey=${encodeURIComponent(
        this.apiKey
      )}&search_field=name&search_value=${encodeURIComponent(searchTerm)}&types=tv`;

      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return null;

      const data = (await res.json()) as {
        title_results?: Array<{ id: number; name: string }>;
      };

      if (data.title_results && data.title_results.length > 0) {
        return data.title_results[0].id.toString();
      }
      return null;
    } catch {
      return null;
    }
  }

  async checkEpisodeAvailability(
    params: CheckAvailabilityParams
  ): Promise<ProviderCheckResult> {
    if (!this.apiKey) {
      return {
        status: "UNSUPPORTED",
        rawDiagnostic: "WATCHMODE_API_KEY is not configured",
      };
    }

    const { providerExternalId, episodeNumber, region } = params;

    try {
      // Query title details / sources for specified region
      const detailsUrl = `${WATCHMODE_BASE_URL}/title/${encodeURIComponent(
        providerExternalId
      )}/details/?apiKey=${encodeURIComponent(
        this.apiKey
      )}&append_to_response=sources`;

      const res = await fetch(detailsUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 429) {
        return { status: "RATE_LIMITED", rawDiagnostic: "Rate limit exceeded (HTTP 429)" };
      }
      if (res.status === 404) {
        return { status: "NOT_FOUND", rawDiagnostic: "Title not found on Watchmode (HTTP 404)" };
      }
      if (res.status >= 500) {
        return { status: "TEMPORARY_ERROR", rawDiagnostic: `Watchmode server error (HTTP ${res.status})` };
      }
      if (!res.ok) {
        return { status: "TEMPORARY_ERROR", rawDiagnostic: `Watchmode returned HTTP ${res.status}` };
      }

      const body = (await res.json()) as {
        id?: number;
        title?: string;
        sources?: Array<{
          source_id: number;
          name: string;
          type: string;
          region: string;
          web_url?: string;
        }>;
      };

      if (!body.sources || body.sources.length === 0) {
        return { status: "NOT_AVAILABLE", rawDiagnostic: "No streaming sources listed" };
      }

      // Filter sources matching requested region and subscription/free streaming type
      const regionSources = body.sources.filter(
        (s) =>
          s.region.toUpperCase() === region.toUpperCase() &&
          (s.type === "sub" || s.type === "free" || s.type === "tv_everywhere")
      );

      if (regionSources.length === 0) {
        return {
          status: "NOT_AVAILABLE",
          rawDiagnostic: `No active subscription sources found for region ${region}`,
        };
      }

      // Check episode list for specific episode confirmation if endpoint supports it
      const epUrl = `${WATCHMODE_BASE_URL}/title/${encodeURIComponent(
        providerExternalId
      )}/episodes/?apiKey=${encodeURIComponent(this.apiKey)}`;

      const epRes = await fetch(epUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });

      let verifiedEpisodeWatchUrl: string | undefined = regionSources[0].web_url;
      let episodeConfirmed = false;

      if (epRes.ok) {
        const epData = (await epRes.json()) as Array<{
          id: number;
          episode_number?: number;
          episode_number_season?: number;
          source_url?: string;
        }>;

        if (Array.isArray(epData)) {
          const matchingEp = epData.find(
            (e) =>
              e.episode_number === episodeNumber ||
              e.episode_number_season === episodeNumber
          );
          if (matchingEp) {
            episodeConfirmed = true;
            if (matchingEp.source_url) {
              verifiedEpisodeWatchUrl = matchingEp.source_url;
            }
          }
        }
      }

      // Confidence Rule: Only claim AVAILABLE if episode exists or title sources are confirmed
      if (episodeConfirmed || regionSources.length > 0) {
        return {
          status: "AVAILABLE",
          watchUrl: verifiedEpisodeWatchUrl,
          sourceReference: `watchmode_title_${providerExternalId}_ep_${episodeNumber}`,
          rawDiagnostic: `Confirmed available via ${regionSources[0].name} (${region})`,
        };
      }

      return {
        status: "UNSUPPORTED",
        rawDiagnostic: "Insufficient episode evidence from Watchmode API",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      return {
        status: "TEMPORARY_ERROR",
        rawDiagnostic: `Watchmode request exception: ${message}`,
      };
    }
  }
}
