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
      .then((data) => {
        // Safe arrays check fallback assignment
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  
  const filteredLogs = logs.filter((log) => {
    if (!log || activeFilter === "All") return true;
    
    const logType = log.type ? String(log.type).toLowerCase().trim() : "";

    // This handles both "order" and "orders", "invoice" and "invoices", etc.
    if (activeFilter === "Orders") return logType.includes("order");
    if (activeFilter === "Invoices") return logType.includes("invoice");
    if (activeFilter === "System") return logType.includes("system");
    
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
      {filteredLogs.length > 0 ? (
        <ActivityTimeline logs={filteredLogs} />
      ) : (
        <p className="text-sm text-neutral-500 italic pl-2 pt-4">No active records found matching this category filter.</p>
      )}
    </div>
  );
}