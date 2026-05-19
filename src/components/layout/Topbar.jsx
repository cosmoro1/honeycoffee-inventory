"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, ClipboardList, FileClock, Home, LayoutDashboard, LogOut, Menu, ReceiptText, Truck } from "lucide-react";
import { BrewLogo } from "@/components/brand/BrewLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { clearSession } from "@/utils/auth";

const mobileItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/deliveries", label: "Deliveries", icon: Truck },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/activity", label: "Logs", icon: FileClock }
];

const pageTitles = {
  "/dashboard": "Dashboard",
  "/orders": "Orders",
  "/invoices": "Invoices",
  "/deliveries": "Deliveries",
  "/inventory": "Inventory",
  "/activity": "Activity Logs"
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur transition-colors dark:border-white/10 dark:bg-[#0b1712]/95">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="lg:hidden">
            <BrewLogo compact />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-emerald-100/55">Monitoring</p>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-emerald-50">{pageTitles[pathname] || "Dashboard"}</h2>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-emerald-100 dark:hover:bg-white/15"
          >
            <Home size={16} aria-hidden="true" />
            Customer Page
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-emerald-100 dark:hover:bg-white/15"
          >
            <LogOut size={16} aria-hidden="true" />
            Logout
          </button>
        </div>

        <div className="lg:hidden" aria-hidden="true">
          <Menu size={22} className="text-slate-500 dark:text-emerald-100/65" />
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 dark:border-white/10 lg:hidden" aria-label="Mobile navigation">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive ? "bg-slate-950 text-white dark:bg-emerald-400 dark:text-emerald-950" : "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-emerald-100"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
