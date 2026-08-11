import { WatchmodeProvider } from "../src/lib/providers/watchmode";

async function verifyWatchmodeIntegration() {
  console.log("==================================================");
  console.log("Watchmode API Integration Verification Script");
  console.log("==================================================");

  const apiKey = process.env.WATCHMODE_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.log("RESULT: WATCHMODE_API_KEY is not set in environment.");
    console.log("API Auth: UNCONFIGURED");
    return;
  }

  console.log("API Auth: Key detected (length: " + apiKey.length + " chars)");

  const provider = new WatchmodeProvider();

  // Test 1: Title Mapping for a known anime ("One Piece")
  console.log("\n--- Test 1: Title Mapping ---");
  const knownAnime = {
    anilistId: 21,
    title: "One Piece",
    titleEnglish: "One Piece",
    malId: 21,
  };

  const titleId = await provider.findTitleMapping(knownAnime);
  console.log(`Title Mapping for "${knownAnime.title}":`, titleId ? `SUCCESS (ID: ${titleId})` : "NO MATCH FOUND");

  if (titleId) {
    // Test 2: Check Episode Availability for Region IN
    console.log("\n--- Test 2: Episode Availability Check (Region: IN) ---");
    const availResult = await provider.checkEpisodeAvailability({
      providerExternalId: titleId,
      episodeNumber: 1,
      region: "IN",
    });

    console.log("Availability Status:", availResult.status);
    if (availResult.watchUrl) {
      console.log("Watch URL:", availResult.watchUrl);
    }
    if (availResult.sourceReference) {
      console.log("Source Reference:", availResult.sourceReference);
    }
    if (availResult.rawDiagnostic) {
      console.log("Diagnostic:", availResult.rawDiagnostic);
    }

    // Test 3: Check Episode Availability for Region US
    console.log("\n--- Test 3: Episode Availability Check (Region: US) ---");
    const availResultUS = await provider.checkEpisodeAvailability({
      providerExternalId: titleId,
      episodeNumber: 1,
      region: "US",
    });

    console.log("Availability Status (US):", availResultUS.status);
    if (availResultUS.rawDiagnostic) {
      console.log("Diagnostic (US):", availResultUS.rawDiagnostic);
    }
  }

  // Test 4: Check Non-Existent Title ID (NOT_FOUND state verification)
  console.log("\n--- Test 4: Non-Existent Title ID (NOT_FOUND Verification) ---");
  const notFoundResult = await provider.checkEpisodeAvailability({
    providerExternalId: "999999999999",
    episodeNumber: 1,
    region: "IN",
  });
  console.log("Non-Existent Title Status:", notFoundResult.status);

  console.log("\n==================================================");
  console.log("Watchmode Integration Verification Completed");
  console.log("==================================================");
}

verifyWatchmodeIntegration().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
