"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardList, FileClock, LayoutDashboard, ReceiptText, Truck } from "lucide-react";
import { BrewLogo } from "@/components/brand/BrewLogo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/invoices", label: "Invoices", icon: ReceiptText },
  { href: "/deliveries", label: "Deliveries", icon: Truck },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/activity", label: "Activity Logs", icon: FileClock }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 overflow-y-auto border-r border-slate-200 bg-white px-4 py-5 transition-colors dark:border-white/10 dark:bg-[#0b1712] lg:block">
      <div className="mb-8">
        <BrewLogo />
      </div>

      <nav className="space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-slate-950 text-white dark:bg-emerald-400 dark:text-emerald-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-emerald-100/75 dark:hover:bg-white/10 dark:hover:text-emerald-50"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
