"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Compass,
  ExternalLink,
  LogOut,
  Plus,
  Radio,
  Search,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  Tv,
  User,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import type { AnimeReminder } from "@/types/anime";
import { useState } from "react";
import { AnimeCard } from "@/components/anime-card";
import { AnimeDetailModal } from "@/components/anime-detail-modal";
import { SearchOverlay } from "@/components/search-overlay";

type TopLevelNav = "following" | "discover" | "settings";
type FollowingFilter = "all" | "available" | "paused";

export function Dashboard({
  initialReminders,
  email,
}: {
  initialReminders: AnimeReminder[];
  email: string;
}) {
  const [reminders, setReminders] = useState(initialReminders);
  const [activeNav, setActiveNav] = useState<TopLevelNav>("following");
  const [followingFilter, setFollowingFilter] = useState<FollowingFilter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<AnimeReminder | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function refresh() {
    const response = await fetch("/api/reminders");
    if (response.ok) {
      const data = await response.json();
      setReminders(data.reminders);
    }
  }

  async function handleToggle(reminder: AnimeReminder) {
    await fetch(`/api/reminders/${reminder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !reminder.enabled }),
    });
    await refresh();
  }

  async function handleRemove(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    setDeletingAccount(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      signOut({ callbackUrl: "/login" });
    } else {
      setDeletingAccount(false);
      alert("Could not delete account. Please try again.");
    }
  }

  // Filtered list inside Following
  const filteredReminders = reminders.filter((r) => {
    if (followingFilter === "paused") return !r.enabled;
    if (followingFilter === "available") {
      return Boolean((r as unknown as { isAvailable?: boolean }).isAvailable);
    }
    return true; // "all"
  });

  // Spotlight show: first active show or first show in list
  const spotlightShow = reminders.find((r) => r.enabled) ?? reminders[0];
  const spotlightTargetDate = spotlightShow ? new Date(spotlightShow.nextAiringAt) : null;
  const spotlightIsPast = spotlightTargetDate && !isNaN(spotlightTargetDate.getTime()) && spotlightTargetDate.getTime() <= Date.now();
  const spotlightConfirmedAvailable = Boolean((spotlightShow as unknown as { isAvailable?: boolean })?.isAvailable);
  const spotlightStreamingUrl = (spotlightShow as unknown as { streamingUrl?: string })?.streamingUrl;

  return (
    <div className="min-h-dvh bg-background text-foreground pb-20 lg:pb-0 lg:pl-64">
      {/* Sidebar Navigation - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-surface px-6 py-6 lg:flex">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex size-3.5 rounded-full bg-accent signal-pulse" />
          <span className="title-font text-2xl font-bold tracking-wider text-white">
            ANIME<span className="text-accent">PULSE</span>
          </span>
        </Link>

        <div className="mt-10 space-y-1">
          <p className="px-3 text-[11px] font-mono uppercase tracking-widest text-muted">Navigation</p>
          
          <button
            type="button"
            onClick={() => setActiveNav("following")}
            className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
              activeNav === "following"
                ? "bg-accent/15 border border-accent/30 text-accent"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Tv className="size-4" /> Following
            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 font-mono text-xs text-white/70">
              {reminders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
              activeNav === "discover"
                ? "bg-accent/15 border border-accent/30 text-accent"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Compass className="size-4" /> Discover
          </button>

          <button
            type="button"
            onClick={() => setActiveNav("settings")}
            className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
              activeNav === "settings"
                ? "bg-accent/15 border border-accent/30 text-accent"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <SettingsIcon className="size-4" /> Settings
          </button>
        </div>

        <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
          <div className="rounded-lg bg-black/40 p-3 border border-white/5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted">Connected Account</p>
            <p className="mt-1 truncate text-xs text-white/90">{email}</p>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-white/70 hover:border-white/20 hover:text-white transition-colors"
          >
            <LogOut className="size-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Top Header - Mobile */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-surface/90 px-4 backdrop-blur-md lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex size-2.5 rounded-full bg-accent signal-pulse" />
          <span className="title-font text-xl font-bold tracking-wider text-white">
            ANIME<span className="text-accent">PULSE</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Add Anime"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-accent/40 bg-accent/15 text-accent"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <AnimatePresence mode="wait">
          {activeNav === "following" && (
            <motion.div
              key="following-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Spotlight Spotlight Section */}
              {spotlightShow && (
                <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl">
                  <div className="absolute inset-0 bg-black/40" />
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay blur-sm"
                    style={{ backgroundImage: `url(${spotlightShow.imageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-transparent" />

                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 p-6 sm:p-8">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-accent/20 border border-accent/40 px-3 py-1 font-mono text-xs uppercase tracking-wider text-accent font-medium">
                          SPOTLIGHT LINEUP
                        </span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider ${
                          spotlightConfirmedAvailable
                            ? "bg-status-available/20 text-status-available border border-status-available/30"
                            : spotlightIsPast
                            ? "bg-status-monitoring/20 text-status-monitoring border border-status-monitoring/30"
                            : "bg-white/10 text-white/80 border border-white/10"
                        }`}>
                          <span className={`size-1.5 rounded-full ${spotlightConfirmedAvailable ? "bg-status-available" : spotlightIsPast ? "bg-status-monitoring signal-pulse" : "bg-accent"}`} />
                          {spotlightConfirmedAvailable ? "AVAILABLE NOW" : spotlightIsPast ? "MONITORING RELEASE" : "RELEASE SCHEDULED"}
                        </span>
                      </div>

                      <h2 className="title-font text-3xl sm:text-5xl font-bold text-white leading-tight">
                        {spotlightShow.titleEnglish ?? spotlightShow.title}
                      </h2>

                      <p className="text-sm text-white/70 font-mono">
                        Episode {spotlightShow.nextEpisode} scheduled airing:{" "}
                        <span className="text-white font-medium">
                          {spotlightTargetDate && !isNaN(spotlightTargetDate.getTime())
                            ? spotlightTargetDate.toLocaleString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                                timeZone: "Asia/Kolkata",
                              })
                            : "TBA"}
                        </span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {/* Display Watch Stream button ONLY if a real streaming URL exists */}
                        {spotlightStreamingUrl && (
                          <a
                            href={spotlightStreamingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-status-available px-5 py-2.5 font-medium text-black hover:bg-status-available/90 transition-colors shadow-lg"
                          >
                            <ExternalLink className="size-4" /> Watch Stream
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedReminder(spotlightShow)}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 font-medium text-white hover:bg-white/20 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Sub-Filters Inside Following */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h1 className="title-font text-3xl sm:text-4xl text-white">YOUR LINEUP</h1>
                  <p className="text-xs font-mono text-muted mt-1">
                    TRACKING {reminders.length} ANIME SHOWS FOR EPISODE RELEASES
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-white/10 bg-surface p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setFollowingFilter("all")}
                      className={`min-h-[36px] px-3 py-1.5 rounded-md font-medium transition-colors ${
                        followingFilter === "all"
                          ? "bg-accent text-white"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      All ({reminders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowingFilter("available")}
                      className={`min-h-[36px] px-3 py-1.5 rounded-md font-medium transition-colors ${
                        followingFilter === "available"
                          ? "bg-accent text-white"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      Available Now ({reminders.filter((r) => Boolean((r as unknown as { isAvailable?: boolean }).isAvailable)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowingFilter("paused")}
                      className={`min-h-[36px] px-3 py-1.5 rounded-md font-medium transition-colors ${
                        followingFilter === "paused"
                          ? "bg-accent text-white"
                          : "text-muted hover:text-white"
                      }`}
                    >
                      Paused ({reminders.filter((r) => !r.enabled).length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-medium text-accent hover:bg-accent/25 transition-colors"
                  >
                    <Plus className="size-4" /> Add Anime
                  </button>
                </div>
              </div>

              {/* Anime Cards Grid */}
              {filteredReminders.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredReminders.map((reminder) => (
                    <AnimeCard
                      key={reminder.id}
                      reminder={reminder}
                      onChanged={refresh}
                      onSelect={(r) => setSelectedReminder(r)}
                    />
                  ))}
                </div>
              ) : (
                <section className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-surface/50 p-8 text-center">
                  <Tv className="size-12 text-white/20" />
                  <h3 className="title-font mt-4 text-2xl text-white">NO ANIME FOUND IN THIS FILTER</h3>
                  <p className="mt-1 text-sm text-muted max-w-md">
                    {followingFilter === "paused"
                      ? "You don't have any paused reminders."
                      : followingFilter === "available"
                      ? "No confirmed available episodes right now. We are monitoring scheduled broadcasts."
                      : "Your lineup is currently empty. Start by adding your favorite anime."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(true)}
                    className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:bg-accent-hover transition-colors"
                  >
                    <Search className="size-4" /> Find Your Anime
                  </button>
                </section>
              )}
            </motion.div>
          )}

          {activeNav === "settings" && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl space-y-8"
            >
              <div>
                <h1 className="title-font text-4xl text-white">SETTINGS</h1>
                <p className="text-xs font-mono text-muted mt-1">ACCOUNT & NTFY NOTIFICATION CONFIGURATION</p>
              </div>

              {/* Account Info */}
              <div className="rounded-xl border border-white/10 bg-surface p-6 space-y-4">
                <div className="flex items-center gap-3 text-lg font-semibold text-white">
                  <User className="size-5 text-accent" /> Account Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-4 text-sm">
                  <div>
                    <span className="text-xs text-muted uppercase font-mono">Email Address</span>
                    <p className="font-medium text-white mt-0.5">{email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted uppercase font-mono">Tracking Status</span>
                    <p className="font-medium text-status-available mt-0.5">Active Lineup ({reminders.length} titles)</p>
                  </div>
                </div>
              </div>

              {/* ntfy Configuration & Test Action */}
              <div className="rounded-xl border border-white/10 bg-surface p-6 space-y-4">
                <div className="flex items-center gap-3 text-lg font-semibold text-white">
                  <Bell className="size-5 text-accent" /> ntfy Delivery Configuration
                </div>

                <p className="text-sm text-white/70 leading-relaxed">
                  AnimePulse sends real-time push notifications directly to your phone via your private ntfy topic whenever an episode drops.
                </p>

                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg bg-black/40 p-4 border border-white/5">
                    <div className="space-y-1">
                      <span className="flex items-center gap-2 text-xs font-mono text-muted uppercase">
                        <Shield className="size-3.5 text-accent" /> ntfy Delivery Channel
                      </span>
                      <p className="text-xs text-white/60">
                        Topic is encrypted at rest. Subscribe to your topic in the ntfy app.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTestStatus("Test notification request triggered. Check your ntfy topic on your phone!");
                        setTimeout(() => setTestStatus(null), 5000);
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent/15 px-4 py-2 text-xs font-medium text-accent hover:bg-accent/25 transition-colors"
                    >
                      <Radio className="size-4" /> Send Test Notification
                    </button>
                  </div>

                  {testStatus && (
                    <div className="rounded-lg bg-status-available/10 border border-status-available/30 px-4 py-3 text-xs text-status-available">
                      {testStatus}
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
                <div className="flex items-center gap-3 text-lg font-semibold text-red-400">
                  <Trash2 className="size-5" /> Account Actions
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-red-500/10 pt-4">
                  <div className="text-xs text-muted space-y-0.5">
                    <p className="font-medium text-white/90">Delete Account & Lineup</p>
                    <p>Permanently remove your account and all tracked anime reminders.</p>
                  </div>

                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={handleDeleteAccount}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {deletingAccount ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Glass Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-center justify-around border-t border-white/10 bg-surface/95 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setActiveNav("following")}
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            activeNav === "following" ? "text-accent" : "text-white/50"
          }`}
        >
          <Tv className="size-5" /> Following
        </button>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-white/50"
        >
          <Compass className="size-5" /> Discover
        </button>

        <button
          type="button"
          onClick={() => setActiveNav("settings")}
          className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
            activeNav === "settings" ? "text-accent" : "text-white/50"
          }`}
        >
          <SettingsIcon className="size-5" /> Settings
        </button>
      </nav>

      {/* Modals */}
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdded={refresh}
      />

      <AnimeDetailModal
        reminder={selectedReminder}
        onClose={() => setSelectedReminder(null)}
        onToggle={handleToggle}
        onRemove={handleRemove}
      />
    </div>
  );
}

