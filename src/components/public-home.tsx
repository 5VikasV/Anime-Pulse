"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Radio, ShieldCheck, Smartphone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const motionEase = [0.22, 1, 0.36, 1] as const;

export function PublicHome({ isAuthenticated }: { isAuthenticated: boolean }) {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? undefined : { opacity: 0, y: 20 };
  const revealIn = reduceMotion ? undefined : { opacity: 1, y: 0 };

  return (
    <main id="main-content" className="min-h-dvh bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-background/80 px-6 py-4 backdrop-blur-xl sm:px-10 lg:px-16">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-3 rounded-full bg-accent signal-pulse" />
          <span className="title-font text-2xl font-bold tracking-wider text-white">
            ANIME<span className="text-accent">PULSE</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main navigation">
          <a href="#how-it-works" className="hidden text-xs font-mono tracking-wider text-muted hover:text-white transition-colors sm:inline-block">
            HOW IT WORKS
          </a>
          {!isAuthenticated && (
            <Link href="/login" className="text-xs font-mono tracking-wider text-muted hover:text-white transition-colors">
              SIGN IN
            </Link>
          )}
          <Link
            href={isAuthenticated ? "/dashboard" : "/signup"}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-accent/40 bg-accent px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-accent-hover shadow-lg"
          >
            {isAuthenticated ? "OPEN DASHBOARD" : "START LINEUP"}
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,59,92,0.15),transparent_50%)]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,245,212,0.08),transparent_50%)]" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] items-center gap-12">
          <motion.div initial={reveal} animate={revealIn} transition={{ duration: 0.6, ease: motionEase }} className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 font-mono text-xs text-accent">
              <span className="size-2 rounded-full bg-accent signal-pulse" />
              INSTANT EPISODE RELEASE ALERTS
            </div>

            <h1 className="title-font text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.95]">
              KNOW THE SECOND YOUR EPISODE DROPS.
            </h1>

            <p className="max-w-xl text-lg text-white/70 leading-relaxed">
              Follow your favorite anime titles and receive instant ntfy push alerts on your phone when an episode actually becomes available.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-all hover:bg-accent-hover shadow-xl"
              >
                {isAuthenticated ? "OPEN YOUR LINEUP" : "BUILD YOUR LINEUP"} <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                SEE HOW IT WORKS
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 font-mono text-xs text-muted">
              <span className="inline-flex items-center gap-2"><Radio className="size-4 text-accent" /> AniList Integration</span>
              <span className="inline-flex items-center gap-2"><BellRing className="size-4 text-status-monitoring" /> Instant Phone Push</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-status-available" /> Encrypted & Private</span>
            </div>
          </motion.div>

          {/* Interactive Mockup Preview */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7, ease: motionEase }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="rounded-3xl border border-white/15 bg-surface p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-4 text-accent" />
                  <span className="font-mono text-xs text-white/80">ntfy Push Preview</span>
                </div>
                <span className="font-mono text-[11px] text-status-available bg-status-available/10 px-2 py-0.5 rounded">CONNECTED</span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-accent/30 bg-accent/10 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-accent">AnimePulse Alert</span>
                    <span className="font-mono text-[10px] text-white/40">Just Now</span>
                  </div>
                  <p className="text-sm font-semibold text-white">Solo Leveling Ep 13 is OUT!</p>
                  <p className="text-xs text-white/70 leading-relaxed">Episode 13 has officially aired and is ready to stream.</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white/80">AnimePulse Alert</span>
                    <span className="font-mono text-[10px] text-white/40">2h ago</span>
                  </div>
                  <p className="text-sm font-semibold text-white">One Piece Ep 1173 Released</p>
                  <p className="text-xs text-white/70 leading-relaxed">Episode 1173 broadcast finished and release confirmed.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-b border-white/10 bg-surface/50 py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 space-y-16">
          <div className="space-y-4 max-w-2xl">
            <h2 className="title-font text-4xl sm:text-6xl text-white">FROM AIRING CALENDAR TO PHONE SCREEN.</h2>
            <p className="text-lg text-muted">
              Zero notification clutter. AnimePulse watches scheduled broadcast calendars and delivers phone alerts when episodes drop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-white/10 bg-surface p-8 space-y-4">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-white font-mono text-sm font-bold">
                01
              </span>
              <h3 className="title-font text-2xl text-white">SELECT YOUR ANIME</h3>
              <p className="text-sm text-muted leading-relaxed">
                Search the AniList catalog and pick the exact anime titles you are following this season.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface p-8 space-y-4">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white font-mono text-sm font-bold">
                02
              </span>
              <h3 className="title-font text-2xl text-white">CONNECT NTFY TOPIC</h3>
              <p className="text-sm text-muted leading-relaxed">
                Pair your private ntfy channel in seconds without complex app installations or account setup.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-surface p-8 space-y-4">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-status-available/20 text-status-available font-mono text-sm font-bold border border-status-available/30">
                03
              </span>
              <h3 className="title-font text-2xl text-white">GET INSTANT ALERTS</h3>
              <p className="text-sm text-muted leading-relaxed">
                Your phone rings with a clean push alert the instant an episode is released.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="py-24 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <h4 className="title-font text-2xl text-white">NO NOISE</h4>
            <p className="text-sm text-muted">No countdown spams, advance reminders, or hourly notifications.</p>
          </div>
          <div className="space-y-2">
            <h4 className="title-font text-2xl text-white">EXACT TIMES</h4>
            <p className="text-sm text-muted">Broadcast times automatically normalized to your local timezone.</p>
          </div>
          <div className="space-y-2">
            <h4 className="title-font text-2xl text-white">PRIVATE BY DEFAULT</h4>
            <p className="text-sm text-muted">Your ntfy channel is encrypted at rest and never shared.</p>
          </div>
          <div className="space-y-2">
            <h4 className="title-font text-2xl text-white">STREAMING LINKS</h4>
            <p className="text-sm text-muted">Direct watch links when confirmed availability is provided.</p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="relative bg-accent py-20 text-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3">
            <h2 className="title-font text-4xl sm:text-6xl font-bold">READY TO START YOUR LINEUP?</h2>
            <p className="text-white/80 max-w-lg">Never check release calendars manually again. Create your lineup in under 60 seconds.</p>
          </div>
          <Link
            href={isAuthenticated ? "/dashboard" : "/signup"}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-black/80 transition-colors shadow-2xl shrink-0"
          >
            {isAuthenticated ? "OPEN DASHBOARD" : "START LINEUP NOW"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background py-8">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-muted">
          <Link href="/" className="title-font text-lg text-white">
            ANIME<span className="text-accent">PULSE</span>
          </Link>
          <p>© {new Date().getFullYear()} AnimePulse — Episode Release Notifications</p>
        </div>
      </footer>
    </main>
  );
}

