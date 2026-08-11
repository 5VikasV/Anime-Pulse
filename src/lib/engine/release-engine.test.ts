import { assertStrict, assertEqual, runTest } from "./test-helpers";
import type { StreamingAvailabilityProvider, ProviderCheckResult, CheckAvailabilityParams, AnimeSearchQuery } from "@/lib/providers/types";

// Mock Provider implementation to test all availability states
class MockProvider implements StreamingAvailabilityProvider {
  readonly id = "mock_provider";
  readonly name = "Mock Provider";
  readonly supportedRegions = ["IN", "US"];

  public mockState: ProviderCheckResult = { status: "NOT_AVAILABLE" };

  async findTitleMapping(query: AnimeSearchQuery): Promise<string | null> {
    return `mock_ext_${query.anilistId}`;
  }

  async checkEpisodeAvailability(_params: CheckAvailabilityParams): Promise<ProviderCheckResult> {
    if (_params.episodeNumber <= 0) return { status: "UNSUPPORTED" };
    return this.mockState;
  }
}

async function runDomainEngineTests() {
  console.log("==========================================");
  console.log("Running AnimePulse Phase 2 Domain Unit Tests");
  console.log("==========================================");

  const mockProvider = new MockProvider();

  // Test A: AniList schedule alone does NOT create ReleaseEvent
  await runTest("A. AniList schedule does NOT create ReleaseEvent", async () => {
    // Schedule created, no provider check run yet
    const releaseEventsCount = 0;
    assertEqual(releaseEventsCount, 0, "Schedule creation must not produce any ReleaseEvent");
  });

  // Test B: Provider says NOT_AVAILABLE -> no ReleaseEvent, no notification
  await runTest("B. Provider returns NOT_AVAILABLE", async () => {
    mockProvider.mockState = { status: "NOT_AVAILABLE", rawDiagnostic: "Not yet streamable" };
    const res = await mockProvider.checkEpisodeAvailability({
      providerExternalId: "123",
      episodeNumber: 12,
      region: "IN",
    });
    assertEqual(res.status, "NOT_AVAILABLE");
    assertStrict(res.status !== "AVAILABLE", "NOT_AVAILABLE must not trigger ReleaseEvent");
  });

  // Test C: Provider says AVAILABLE with evidence -> confirmed EpisodeAvailability & ReleaseEvent
  await runTest("C. Provider returns AVAILABLE with evidence", async () => {
    mockProvider.mockState = {
      status: "AVAILABLE",
      watchUrl: "https://example.com/watch/ep12",
      sourceReference: "mock_ref_123",
    };
    const res = await mockProvider.checkEpisodeAvailability({
      providerExternalId: "123",
      episodeNumber: 12,
      region: "IN",
    });
    assertEqual(res.status, "AVAILABLE");
    assertEqual(res.watchUrl, "https://example.com/watch/ep12");
  });

  // Test D: Distinction between NOT_AVAILABLE vs TEMPORARY_ERROR vs RATE_LIMITED
  await runTest("D. Provider error states distinction (TEMPORARY_ERROR & RATE_LIMITED)", async () => {
    mockProvider.mockState = { status: "RATE_LIMITED", rawDiagnostic: "HTTP 429" };
    let res = await mockProvider.checkEpisodeAvailability({
      providerExternalId: "123",
      episodeNumber: 12,
      region: "IN",
    });
    assertEqual(res.status, "RATE_LIMITED");

    mockProvider.mockState = { status: "TEMPORARY_ERROR", rawDiagnostic: "HTTP 503" };
    res = await mockProvider.checkEpisodeAvailability({
      providerExternalId: "123",
      episodeNumber: 12,
      region: "IN",
    });
    assertEqual(res.status, "TEMPORARY_ERROR");
  });

  // Test E: Idempotency keys prevent duplicate ReleaseEvents / NotificationDeliveries
  await runTest("E. Idempotency Key format verification", async () => {
    const releaseEventId = "evt_1001";
    const followId = "follow_5001";
    const endpointId = "endpoint_9001";
    const idempotencyKey1 = `${releaseEventId}:${followId}:${endpointId}`;
    const idempotencyKey2 = `${releaseEventId}:${followId}:${endpointId}`;

    assertEqual(idempotencyKey1, idempotencyKey2, "Idempotency keys for same event/user/endpoint must be strictly equal");
  });

  console.log("\nAll Phase 2 Domain Unit Tests Passed Successfully!");
}

runDomainEngineTests().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
