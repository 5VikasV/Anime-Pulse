import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh bg-background lg:grid-cols-[1.2fr_0.8fr]">
      <section className="relative hidden border-r border-white/10 bg-[url('https://cdn.myanimelist.net/images/anime/1015/138006l.jpg')] bg-cover bg-center lg:block">
        <div className="card-shade absolute inset-0" />
        <div className="absolute bottom-12 left-12 space-y-3">
          <p className="title-font text-7xl font-bold leading-none text-white">
            ANIME<br />
            <span className="text-accent">PULSE</span>
          </p>
          <p className="max-w-sm text-base text-white/70">
            Instant episode release notifications. Right on your phone.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-dvh items-center px-6 py-16 sm:px-12 bg-surface/50">
        <Link
          href="/"
          className="absolute left-6 top-6 inline-flex min-h-[44px] items-center gap-2 text-xs font-mono tracking-wider text-muted transition-colors hover:text-white sm:left-12"
        >
          <ArrowLeft className="size-4" /> Back to AnimePulse
        </Link>
        <div className="mx-auto w-full max-w-sm">
          <h1 className="title-font mb-8 text-5xl font-bold text-white">SIGN IN</h1>
          <AuthForm mode="login" />
        </div>
      </section>
    </main>
  );
}

