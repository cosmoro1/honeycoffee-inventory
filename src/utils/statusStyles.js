const statusMap = {
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
  Confirmed: "bg-sky-100 text-sky-800 ring-sky-200",
  Delivered: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "In Transit": "bg-blue-100 text-blue-800 ring-blue-200",
  Paid: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Unpaid: "bg-rose-100 text-rose-800 ring-rose-200",
  OK: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "Low Stock": "bg-orange-100 text-orange-800 ring-orange-200",
  Critical: "bg-red-100 text-red-800 ring-red-200",
  Processing: "bg-indigo-100 text-indigo-800 ring-indigo-200"
};

export function getStatusClass(status) {
  return statusMap[status] || "bg-slate-100 text-slate-700 ring-slate-200";
}

export function getStatusTone(status) {
  if (["Delivered", "Paid", "OK"].includes(status)) return "success";
  if (["Pending", "In Transit", "Low Stock"].includes(status)) return "warning";
  if (["Unpaid", "Critical"].includes(status)) return "danger";
  return "info";
}
