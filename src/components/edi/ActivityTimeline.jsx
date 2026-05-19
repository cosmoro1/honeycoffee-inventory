import { StatusBadge } from "@/components/ui/StatusBadge";

export function ActivityTimeline({ logs }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/10">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-coffee dark:text-emerald-300">Activity Logs</p>
        <h3 className="text-xl font-semibold text-slate-950 dark:text-emerald-50">Recent EDI actions</h3>
      </div>

      <ol className="space-y-4">
        {logs.map((log) => (
          <li key={log.id} className="relative pl-7">
            <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-coffee ring-4 ring-orange-100 dark:bg-emerald-300 dark:ring-emerald-300/15" />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950 dark:text-emerald-50">{log.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-emerald-100/65">{log.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-emerald-100/65">{log.time}</span>
                <StatusBadge status={log.status} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
