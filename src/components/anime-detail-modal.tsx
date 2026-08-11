"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Calendar, ExternalLink, Trash2, X } from "lucide-react";
import type { AnimeReminder } from "@/types/anime";
import { useEffect } from "react";

interface AnimeDetailModalProps {
  reminder: AnimeReminder | null;
  onClose: () => void;
  onToggle: (reminder: AnimeReminder) => void;
  onRemove: (reminderId: string) => void;
}

export function AnimeDetailModal({ reminder, onClose, onToggle, onRemove }: AnimeDetailModalProps) {
  useEffect(() => {
    if (!reminder) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reminder, onClose]);

  if (!reminder) return null;

  const targetDate = new Date(reminder.nextAiringAt);
  const isPast = !isNaN(targetDate.getTime()) && targetDate.getTime() <= Date.now();
  const airingTime = !isNaN(targetDate.getTime())
    ? targetDate.toLocaleString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
    : "TBA";

  const displayTitle = reminder.titleEnglish ?? reminder.title;
  // Check if a real streaming URL exists on the object (only if present in backend payload)
  const streamingUrl = (reminder as unknown as { streamingUrl?: string }).streamingUrl;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={displayTitle}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-surface shadow-2xl"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail modal"
            className="absolute right-4 top-4 z-20 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/70 transition-colors hover:bg-black hover:text-white"
          >
            <X className="size-5" />
          </button>

          <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-black">
            <Image
              src={reminder.imageUrl}
              alt=""
              fill
              quality={90}
              priority
              className="object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider ${
                  !reminder.enabled
                    ? "bg-white/10 text-white/50"
                    : isPast
                    ? "bg-status-monitoring/20 text-status-monitoring border border-status-monitoring/30"
                    : "bg-accent/20 text-accent border border-accent/30"
                }`}>
                  <span className={`size-1.5 rounded-full ${!reminder.enabled ? "bg-white/40" : isPast ? "bg-status-monitoring signal-pulse" : "bg-accent"}`} />
                  {!reminder.enabled ? "PAUSED" : isPast ? "MONITORING RELEASE" : "RELEASE SCHEDULED"}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs uppercase tracking-wider text-white/80 border border-white/10">
                  EPISODE {reminder.nextEpisode} {reminder.totalEpisodes ? `/ ${reminder.totalEpisodes}` : ""}
                </span>
              </div>

              <h2 className="title-font mt-3 text-3xl sm:text-4xl text-white line-clamp-2">
                {displayTitle}
              </h2>
              {reminder.titleEnglish && reminder.titleEnglish !== reminder.title && (
                <p className="mt-1 text-sm text-white/50 truncate">{reminder.title}</p>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-white/5 bg-black/30 p-4 text-sm">
              <div className="space-y-1">
                <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                  <Calendar className="size-4 text-accent" /> Scheduled Airing
                </span>
                <p className="font-medium text-white">{airingTime}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted">Notification Status</span>
                <p className="font-medium text-white">
                  {reminder.enabled ? "Active — ntfy alert ready on episode drop" : "Paused — no notifications will be sent"}
                </p>
              </div>
            </div>

            {/* Render Watch/Stream button ONLY if a real streaming URL exists in the data */}
            {streamingUrl && (
              <a
                href={streamingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-status-available font-medium text-black hover:bg-status-available/90 transition-colors"
              >
                <ExternalLink className="size-4" /> Watch Now
              </a>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => onToggle(reminder)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  reminder.enabled
                    ? "border-white/15 bg-white/5 text-white hover:border-white/30"
                    : "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
                }`}
              >
                {reminder.enabled ? (
                  <>
                    <BellOff className="size-4 text-white/60" /> Pause Notifications
                  </>
                ) : (
                  <>
                    <Bell className="size-4" /> Resume Notifications
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onRemove(reminder.id);
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="size-4" /> Remove Title
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
