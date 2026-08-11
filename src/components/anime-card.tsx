"use client";

import Image from "next/image";
import { ExternalLink, Trash2 } from "lucide-react";
import type { AnimeReminder } from "@/types/anime";
import { Countdown } from "@/components/countdown";

interface AnimeCardProps {
  reminder: AnimeReminder;
  onChanged: () => void;
  onSelect?: (reminder: AnimeReminder) => void;
}

export function AnimeCard({ reminder, onChanged, onSelect }: AnimeCardProps) {
  const target = reminder.nextAiringAt.toString();
  const targetDate = new Date(target);
  const isPast = !isNaN(targetDate.getTime()) && targetDate.getTime() <= Date.now();
  
  // Real status checks according to Rule 1:
  // "AVAILABLE NOW" ONLY if backend provides explicit confirmed availability field
  const isConfirmedAvailable = Boolean((reminder as unknown as { isAvailable?: boolean }).isAvailable);
  const statusLabel = !reminder.enabled
    ? "PAUSED"
    : isConfirmedAvailable
    ? "AVAILABLE NOW"
    : isPast
    ? "MONITORING RELEASE"
    : "RELEASE SCHEDULED";

  const displayTitle = reminder.titleEnglish ?? reminder.title;
  const airingTime = !isNaN(targetDate.getTime())
    ? targetDate.toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "TBA";

  // Check if a real streaming URL exists on the object (Rule 2: Do NOT invent search URLs)
  const streamingUrl = (reminder as unknown as { streamingUrl?: string }).streamingUrl;

  async function toggle(e: React.MouseEvent | React.ChangeEvent) {
    e.stopPropagation();
    await fetch(`/api/reminders/${reminder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !reminder.enabled }),
    });
    onChanged();
  }

  async function remove(e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <article
      onClick={() => onSelect?.(reminder)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-card transition-all duration-300 hover:border-white/20 hover:bg-card-hover hover:shadow-xl cursor-pointer"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/50">
        <Image
          src={reminder.imageUrl}
          alt=""
          fill
          quality={90}
          sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
            !reminder.enabled ? "opacity-40 grayscale" : "opacity-90"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider backdrop-blur-md ${
              !reminder.enabled
                ? "bg-black/70 text-white/50 border border-white/10"
                : isConfirmedAvailable
                ? "bg-status-available/20 text-status-available border border-status-available/40 font-semibold"
                : isPast
                ? "bg-status-monitoring/20 text-status-monitoring border border-status-monitoring/30"
                : "bg-black/70 text-white/80 border border-white/10"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                !reminder.enabled
                  ? "bg-white/30"
                  : isConfirmedAvailable
                  ? "bg-status-available"
                  : isPast
                  ? "bg-status-monitoring signal-pulse"
                  : "bg-accent"
              }`}
            />
            {statusLabel}
          </span>

          <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white shadow-md">
            EP {reminder.nextEpisode}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4 space-y-4">
        <div>
          <h3 className="title-font text-lg text-white font-semibold line-clamp-2 group-hover:text-accent transition-colors">
            {displayTitle}
          </h3>
          {reminder.titleEnglish && reminder.titleEnglish !== reminder.title && (
            <p className="mt-0.5 truncate text-xs text-muted">{reminder.title}</p>
          )}
        </div>

        <div className="space-y-2 border-t border-white/5 pt-3 text-xs">
          <div className="flex items-center justify-between text-muted">
            <span>Scheduled Airing</span>
            <span className="font-mono text-white/90">{airingTime}</span>
          </div>

          <div className="flex items-center justify-between text-muted">
            <span>Status</span>
            <span className="font-mono">
              <Countdown target={target} />
            </span>
          </div>
        </div>

        {/* Display Watch button ONLY if a real streaming URL exists */}
        {streamingUrl && (
          <a
            href={streamingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-lg bg-status-available/15 border border-status-available/30 font-mono text-xs text-status-available hover:bg-status-available/25 transition-colors"
          >
            <ExternalLink className="size-3.5" /> Watch Stream
          </a>
        )}

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <button
            type="button"
            onClick={toggle}
            className="flex min-h-[44px] items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-white/80 hover:border-white/20 hover:text-white transition-colors"
          >
            <span
              className={`size-2 rounded-full ${
                reminder.enabled ? "bg-status-available" : "bg-white/30"
              }`}
            />
            {reminder.enabled ? "Notifications ON" : "Paused"}
          </button>

          <button
            type="button"
            onClick={remove}
            aria-label={`Remove ${displayTitle} from lineup`}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 text-muted hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

