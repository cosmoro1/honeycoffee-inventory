export function StatCard({ label, value, helper, icon: Icon, tone = "neutral" }) {
  const toneClasses = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700"
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-emerald-100/65">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-emerald-50">{value}</p>
        </div>
        {Icon ? (
          <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
            <Icon size={22} aria-hidden="true" />
          </div>
        ) : null}
      </div>
      {helper ? <p className="mt-4 text-sm text-slate-500 dark:text-emerald-100/60">{helper}</p> : null}
    </article>
  );
}
