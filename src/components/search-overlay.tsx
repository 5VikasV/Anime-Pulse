"use client";

import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AnimeSearchResult } from "@/lib/anilist";

export function SearchOverlay({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setMessage("");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setMessage("");
      try {
        const response = await fetch(
          `/api/anime/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const body = await response.json();
        if (response.ok) {
          setResults(body.results);
          if (!body.results.length) setMessage("No titles found. Try searching in English or Romaji.");
        } else {
          setResults([]);
          setMessage(body.error ?? "Search is temporarily unavailable");
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") setMessage("Search is temporarily unavailable");
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function add(anilistId: number) {
    setBusy(anilistId);
    setMessage("");
    const response = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anilistId }),
    });
    const body = await response.json();
    setBusy(null);
    if (!response.ok) {
      setMessage(body.error ?? "Could not add anime");
      return;
    }
    setAddedIds((prev) => new Set(prev).add(anilistId));
    onAdded();
    if (body.testNotification === "failed") {
      setMessage("Anime added to lineup — Test notification failed. Check your ntfy topic setting.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search anime"
          className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex size-3 rounded-full bg-accent signal-pulse" />
              <span className="title-font text-xl text-white">ANIME DISCOVERY</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close search overlay"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 text-white/70 hover:border-white/20 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-accent" />
              <input
                autoFocus
                id="anime-search"
                name="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anime catalog by title..."
                className="w-full rounded-xl border border-white/15 bg-surface py-4 pl-14 pr-12 text-xl text-white outline-none placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-accent" />
              )}
            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-accent/10 border border-accent/20 px-4 py-2.5 text-sm text-accent">
                {message}
              </p>
            )}

            <div className="mt-8 flex-1 overflow-y-auto pr-1">
              {results.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pb-12">
                  {results.map((anime) => {
                    const isAdded = addedIds.has(anime.anilistId);
                    const isLoading = busy === anime.anilistId;
                    const displayTitle = anime.titleEnglish ?? anime.title;

                    return (
                      <article
                        key={anime.anilistId}
                        className="group flex flex-col overflow-hidden rounded-lg border border-white/10 bg-card hover:border-white/20 transition-all"
                      >
                        <div className="relative aspect-[2/3] w-full bg-black/40 overflow-hidden">
                          <Image
                            src={anime.imageUrl}
                            alt=""
                            fill
                            quality={90}
                            sizes="(min-width: 1024px) 200px, (min-width: 640px) 180px, 140px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <button
                            disabled={isLoading || isAdded}
                            onClick={() => add(anime.anilistId)}
                            type="button"
                            aria-label={`Follow ${displayTitle}`}
                            className={`absolute bottom-2 right-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border shadow-lg transition-all ${
                              isAdded
                                ? "bg-status-available border-status-available text-black"
                                : "bg-accent border-accent text-white hover:bg-accent-hover"
                            } disabled:opacity-80`}
                          >
                            {isLoading ? (
                              <Loader2 className="size-5 animate-spin" />
                            ) : isAdded ? (
                              <Check className="size-5" />
                            ) : (
                              <Plus className="size-5" />
                            )}
                          </button>
                        </div>

                        <div className="flex flex-1 flex-col justify-between p-3">
                          <h3 className="title-font text-sm text-white font-medium line-clamp-2">
                            {displayTitle}
                          </h3>
                          <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-muted">
                            {anime.airing ? "CURRENTLY AIRING" : anime.status ?? anime.type ?? "ANIME"}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : !searching && query.trim().length < 2 ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center text-center text-muted space-y-3">
                  <Search className="size-10 text-white/20" />
                  <p className="text-sm">Type at least 2 characters to search AniList catalog</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

