import { WatchmodeProvider } from "./watchmode";
import type { StreamingAvailabilityProvider } from "./types";

export * from "./types";
export * from "./watchmode";

const providers: Record<string, StreamingAvailabilityProvider> = {
  watchmode: new WatchmodeProvider(),
};

export function getProvider(identifier = "watchmode"): StreamingAvailabilityProvider {
  const provider = providers[identifier.toLowerCase()];
  if (!provider) {
    throw new Error(`Streaming provider '${identifier}' is not registered`);
  }
  return provider;
}
