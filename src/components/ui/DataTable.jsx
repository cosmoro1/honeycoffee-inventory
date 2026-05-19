import { EmptyState } from "@/components/ui/EmptyState";

export function DataTable({ columns, rows, getRowKey }) {
  if (!rows?.length) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft dark:border-white/10 dark:bg-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-white/10">
          <thead className="bg-slate-50 dark:bg-white/10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-emerald-100/70"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-white/10 dark:bg-transparent">
            {rows.map((row, index) => (
              <tr key={getRowKey ? getRowKey(row) : index} className="hover:bg-slate-50 dark:hover:bg-white/10">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-4 text-sm text-slate-700 dark:text-emerald-50/85">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
