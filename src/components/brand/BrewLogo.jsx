import { Bean, Coffee } from "lucide-react";

export function BrewLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b5b38] text-white shadow-sm dark:bg-emerald-400 dark:text-emerald-950">
        <Coffee size={24} strokeWidth={2.2} aria-hidden="true" />
        <Bean className="absolute -right-1 -top-1 rounded-full bg-[#fbf8ea] p-0.5 text-[#0b5b38] dark:bg-[#07130f] dark:text-emerald-300" size={18} strokeWidth={2.4} aria-hidden="true" />
      </div>
      {!compact ? (
        <div>
          <p className="text-2xl font-black leading-6 tracking-tight text-[#082d1d] dark:text-emerald-50">BREW</p>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0b5b38] dark:text-emerald-300">Coffee</p>
        </div>
      ) : null}
    </div>
  );
}
