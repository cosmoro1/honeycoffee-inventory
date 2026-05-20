"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/components/edi/ActivityTimeline";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetch("/api/activity-logs", { cache: "no-store" })
      .then((r) => r.json())
      .then(setLogs)
      .catch(console.error);
  }, []);

  // Filter types mapping based on your DB log entry 'type' column strings
  const filteredLogs = logs.filter((log) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Orders") return log.type.toLowerCase() === "order";
    if (activeFilter === "Invoices") return log.type.toLowerCase() === "invoice";
    if (activeFilter === "System") return log.type.toLowerCase() === "system";
    return true;
  });

  const filters = ["All", "Orders", "Invoices", "System"];

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Activity Logs"
        title="EDI transaction timeline"
        description="Follow the latest order, invoice, delivery, and inventory updates in one monitoring feed."
      />

      {/* Modern Glassmorphic Filter Tab Bar */}
      <div className="flex space-x-2 bg-neutral-900/40 backdrop-blur-md p-1.5 rounded-xl border border-neutral-800/60 w-fit">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeFilter === filter
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Rendered Timeline Feed */}
      <ActivityTimeline logs={filteredLogs} />
    </div>
  );
}