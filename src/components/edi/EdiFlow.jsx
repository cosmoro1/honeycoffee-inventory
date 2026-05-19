import { CheckCircle2, CircleDot, FileText, PackageCheck, ReceiptText, Truck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

const steps = [
  {
    label: "Order Created",
    detail: "Order received",
    status: "Delivered",
    icon: CircleDot
  },
  {
    label: "Invoice Generated",
    detail: "Billing prepared",
    status: "Paid",
    icon: ReceiptText
  },
  {
    label: "Delivery In Transit",
    detail: "Supplier update",
    status: "In Transit",
    icon: Truck
  },
  {
    label: "Delivered",
    detail: "Order completed",
    status: "Delivered",
    icon: PackageCheck
  },
  {
    label: "Inventory Updated",
    detail: "Stock refreshed",
    status: "OK",
    icon: CheckCircle2
  }
];

export function EdiFlow() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-coffee dark:text-emerald-300">EDI Flow</p>
          <h3 className="text-xl font-semibold text-slate-950 dark:text-emerald-50">Transaction visibility</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-emerald-100/65">
          <FileText size={16} aria-hidden="true" />
          Latest supplier transaction
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.label} className="relative rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-black/20">
              {index < steps.length - 1 ? (
                <div className="absolute -right-3 top-1/2 hidden h-px w-3 bg-slate-300 dark:bg-white/15 lg:block" aria-hidden="true" />
              ) : null}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-coffee ring-1 ring-slate-200 dark:bg-white/10 dark:text-emerald-300 dark:ring-white/10">
                  <Icon size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-950 dark:text-emerald-50">{step.label}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-emerald-100/65">{step.detail}</p>
                  <div className="mt-3">
                    <StatusBadge status={step.status} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
