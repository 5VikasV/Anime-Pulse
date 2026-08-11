export interface AnimeReminder {
  id: string;
  userId: string;
  anilistId: number;
  malId?: number | null;
  title: string;
  titleEnglish?: string | null;
  imageUrl: string;
  nextEpisode: number;
  nextAiringAt: Date | string;
  totalEpisodes?: number | null;
  enabled: boolean;
  isAvailable?: boolean;
  streamingUrl?: string | null;
}
