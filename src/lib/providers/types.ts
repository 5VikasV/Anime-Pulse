export type AvailabilityStatus =
  | "AVAILABLE"
  | "NOT_AVAILABLE"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "TEMPORARY_ERROR"
  | "UNSUPPORTED";

export interface CheckAvailabilityParams {
  providerExternalId: string;
  episodeNumber: number;
  region: string;
}

export interface ProviderCheckResult {
  status: AvailabilityStatus;
  watchUrl?: string;
  sourceReference?: string;
  rawDiagnostic?: string;
}

export interface AnimeSearchQuery {
  anilistId: number;
  title: string;
  titleEnglish?: string | null;
  malId?: number | null;
}

export interface StreamingAvailabilityProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedRegions: string[];

  findTitleMapping(query: AnimeSearchQuery): Promise<string | null>;
  checkEpisodeAvailability(params: CheckAvailabilityParams): Promise<ProviderCheckResult>;
}
