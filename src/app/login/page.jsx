"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Coffee, Lock, User } from "lucide-react";
import { useState } from "react";
import { BrewLogo } from "@/components/brand/BrewLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { setSession } from "@/utils/auth";

const STAFF_USERNAME = "brewadmin";
const STAFF_PASSWORD = "brew2026";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (username.trim() !== STAFF_USERNAME || password !== STAFF_PASSWORD) {
      setError("Invalid username or password.");
      return;
    }

    setSession({
      role: "staff",
      name: "BREW Staff",
      label: "Admin / Owner"
    });
    router.push("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ed] px-4 py-6 text-[#082d1d] dark:bg-[#07130f] dark:text-emerald-50">
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-[#d8efe2]/70 blur-3xl dark:bg-emerald-900/35" />
      <div className="absolute bottom-[-12rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#f5d6be]/80 blur-3xl dark:bg-amber-900/20" />
      <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-3xl dark:bg-white/5" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/55 shadow-[0_30px_90px_rgba(28,40,32,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_30px_90px_rgba(0,0,0,0.35)] lg:grid-cols-[1fr_430px]">
          <div className="p-6 sm:p-8 lg:p-10">
            <BrewLogo />

            <div className="mt-12 max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[#0b5b38]/15 bg-white/70 px-3 py-1.5 text-sm font-bold text-[#0b5b38] dark:border-white/10 dark:bg-white/10 dark:text-emerald-200">
                <Coffee size={15} aria-hidden="true" />
                Welcome to BREW
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight text-[#082d1d] dark:text-emerald-50 sm:text-5xl">
                Every cup starts with a warm welcome.
              </h1>
              <p className="mt-4 text-base leading-7 text-[#667268] dark:text-emerald-100/70">
                Settle in, explore the menu, and let BREW make your day lighter.
              </p>
            </div>

            <Link
              href="/"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0b5b38] px-5 py-3 text-sm font-black text-white shadow-lg shadow-[#0b5b38]/20 transition hover:bg-[#08492d]"
            >
              Continue as Customer
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <div className="border-t border-white/70 bg-white/60 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:border-l lg:border-t-0">
            <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-[#0b5b38]/10 bg-[#fbf8ea]/70 p-5 dark:border-white/10 dark:bg-black/20">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-[#0b5b38] dark:text-emerald-300">Staff Access</p>
                <h2 className="mt-2 text-2xl font-black text-[#082d1d] dark:text-emerald-50">Login</h2>
              </div>

              <label className="mt-6 block">
                <span className="text-sm font-bold text-[#5e6d61] dark:text-emerald-100/70">Username</span>
                <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 shadow-sm focus-within:border-[#0b5b38]/35 dark:border-white/10 dark:bg-white/10 dark:focus-within:border-emerald-300/45">
                  <User size={17} className="text-[#0b5b38] dark:text-emerald-300" aria-hidden="true" />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#082d1d] outline-none placeholder:text-[#899389] dark:text-emerald-50 dark:placeholder:text-emerald-100/45"
                    placeholder="Enter username"
                    autoComplete="username"
                  />
                </span>
              </label>

              <label className="mt-4 block">
                <span className="text-sm font-bold text-[#5e6d61] dark:text-emerald-100/70">Password</span>
                <span className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 shadow-sm focus-within:border-[#0b5b38]/35 dark:border-white/10 dark:bg-white/10 dark:focus-within:border-emerald-300/45">
                  <Lock size={17} className="text-[#0b5b38] dark:text-emerald-300" aria-hidden="true" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#082d1d] outline-none placeholder:text-[#899389] dark:text-emerald-50 dark:placeholder:text-emerald-100/45"
                    placeholder="Enter password"
                    type="password"
                    autoComplete="current-password"
                  />
                </span>
              </label>

              {error ? (
                <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:bg-red-500/15 dark:text-red-200">{error}</p>
              ) : null}

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#0b5b38] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#0b5b38]/20 transition hover:bg-[#08492d]"
              >
                Login
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
