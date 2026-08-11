"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === "signup") {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Could not create account");
        setLoading(false);
        return;
      }
    }
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setError("Email or password is incorrect");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm border-t border-white/10 pt-6">
      <div className="space-y-4">
        <label className="block text-sm text-white/80 font-medium" htmlFor="email">
          Email Address
          <input
            className="mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-surface px-3.5 text-sm text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="block text-sm text-white/80 font-medium" htmlFor="password">
          Password
          <input
            className="mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-surface px-3.5 text-sm text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            id="password"
            name="password"
            type="password"
            minLength={mode === "login" ? 8 : 12}
            maxLength={72}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </label>

        {mode === "signup" && (
          <label className="block text-sm text-white/80 font-medium" htmlFor="ntfyTopic">
            Private ntfy Topic
            <input
              className="mt-1.5 min-h-[44px] w-full rounded-lg border border-white/15 bg-surface px-3.5 text-sm text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-mono"
              id="ntfyTopic"
              name="ntfyTopic"
              type="text"
              minLength={12}
              maxLength={64}
              pattern={"[a-zA-Z0-9_\\-]+"}
              placeholder="e.g. my-private-anime-alerts"
              autoComplete="off"
              required
            />
            <span className="mt-1.5 block text-xs leading-relaxed text-muted">
              Choose a hard-to-guess secret topic, then subscribe to it in your ntfy app.
            </span>
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-accent/10 border border-accent/30 p-3 text-xs text-accent">
          {error}
        </p>
      )}

      <button
        disabled={loading}
        type="submit"
        className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50 shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Processing...
          </>
        ) : mode === "login" ? (
          "SIGN IN"
        ) : (
          "CREATE ACCOUNT"
        )}
      </button>

      <p className="mt-5 text-center text-xs text-muted">
        {mode === "login" ? "Don't have a lineup yet?" : "Already tracking?"}{" "}
        <Link
          className="text-white font-medium underline underline-offset-4 hover:text-accent transition-colors"
          href={mode === "login" ? "/signup" : "/login"}
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}

