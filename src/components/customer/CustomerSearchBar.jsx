import { Search } from "lucide-react";

export function CustomerSearchBar({ value, onChange }) {
  return (
    <label className="flex h-12 flex-1 items-center gap-3 rounded-full border border-white/80 bg-white/70 px-4 text-[#0b5b38] shadow-sm backdrop-blur-xl focus-within:border-[#0b5b38]/35 dark:border-emerald-300/10 dark:bg-[#13241b] dark:text-emerald-300 dark:focus-within:border-emerald-300/60">
      <Search size={18} aria-hidden="true" />
      <span className="sr-only">Search menu</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#082d1d] outline-none placeholder:text-[#7d8b80] dark:text-white dark:placeholder:text-emerald-100/70"
        placeholder="Search coffee, tea, beans..."
      />
    </label>
  );
}
