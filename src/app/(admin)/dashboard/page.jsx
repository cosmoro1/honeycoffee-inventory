"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardList, PackageCheck, Truck } from "lucide-react";
import { ActivityTimeline } from "@/components/edi/ActivityTimeline";
import { EdiFlow } from "@/components/edi/EdiFlow";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function DashboardPage() {
  const [stats, setStats]       = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [logs, setLogs]         = useState([]);

  useEffect(() => {
    // Fetch stats
    fetch("/api/dashboard-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);

    // Fetch invoices
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.invoices)) {
          setInvoices(data.invoices);
        } else if (Array.isArray(data)) {
          setInvoices(data);
        }
      })
      .catch(console.error);

    // Fetch activity logs safely (resolves logs.map error)
    fetch("/api/activity-logs")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.logs)) {
          setLogs(data.logs);
        } else if (Array.isArray(data)) {
          setLogs(data);
        }
      })
      .catch(console.error);
  }, []);

  const invoiceColumns = [
    { key: "id",       header: "Invoice ID" },
    { key: "orderId",  header: "Order Ref" },
    { key: "amount",   header: "Amount" },
    { key: "status",   header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Orders"     value={stats?.totalOrders    ?? "—"} helper="All monitored EDI orders"    icon={ClipboardList} tone="info"    />
        <StatCard label="Pending Orders"  value={stats?.pendingOrders  ?? "—"} helper="Needs supplier confirmation" icon={AlertTriangle} tone="warning" />
        <StatCard label="Delivered Orders"value={stats?.deliveredOrders?? "—"} helper="Completed deliveries"          icon={Truck}         tone="success" />
        <StatCard label="Low Stock Alert" value={stats?.lowStockItems   ?? "—"} helper="Items below safe level"        icon={PackageCheck}  tone="danger"  />
      </section>

      <EdiFlow />

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Invoices"
            title="Invoice monitoring"
            description="Quick view of generated invoices connected to EDI orders."
          />
          <DataTable columns={invoiceColumns} rows={invoices} getRowKey={(row) => row.id} />
        </div>
        <ActivityTimeline logs={logs} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/10">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-emerald-100/65">Active deliveries</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-emerald-50">
              {stats?.activeDeliveries ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-emerald-100/65">Inventory checks</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-emerald-50">
              {stats?.inventoryCount ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-emerald-100/65">Latest update</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-emerald-50">
              {stats?.latestUpdate ?? "—"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}