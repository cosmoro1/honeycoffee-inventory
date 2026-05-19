export function EmptyState({ title = "No data available", message = "There are no monitoring records to show yet." }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/15 dark:bg-white/10">
      <p className="text-sm font-semibold text-slate-950 dark:text-emerald-50">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-emerald-100/65">{message}</p>
    </div>
  );
}
