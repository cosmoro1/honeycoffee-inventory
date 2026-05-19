"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrewLogo } from "@/components/brand/BrewLogo";
import { getSession } from "@/utils/auth";

export function AdminGuard({ children }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    setHasSession(true);
    setIsChecking(false);
  }, [router]);

  if (isChecking || !hasSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ec] px-4">
        <div className="rounded-[2rem] border border-white/70 bg-white/70 p-8 text-center shadow-[0_24px_70px_rgba(28,40,32,0.12)] backdrop-blur-xl">
          <div className="flex justify-center">
            <BrewLogo />
          </div>
          <p className="mt-5 text-sm font-semibold text-[#5f6b61]">Checking admin access...</p>
        </div>
      </main>
    );
  }

  return children;
}
