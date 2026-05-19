import { getStatusClass } from "@/utils/statusStyles";

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClass(status)}`}>
      {status}
    </span>
  );
}
