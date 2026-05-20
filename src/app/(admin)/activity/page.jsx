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
        setLogs(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, []);

  // Filter types using log.title since the backend aliases the 'type' column
  const filteredLogs = logs.filter((log) => {
    if (!log || activeFilter === "All") return true;
    
    // Read from title since the API renames type -> title
    const logType = log.title ? String(log.title).toLowerCase().trim() : "";
    const docType = log.edi_doc_type ? String(log.edi_doc_type).trim() : "";

    if (activeFilter === "Orders") return logType.includes("order");
    if (activeFilter === "Invoices") return logType.includes("invoice");
    if (activeFilter === "System") return logType.includes("system") || logType === "alert";
    
    // 🚚 Delivery Filter Condition: catches text descriptions or EDI 856 documents
    if (activeFilter === "Deliveries") {
      return logType.includes("delivery") || logType.includes("shipment") || docType === "856";
    }
    
    return true;
  });

  // Added "Deliveries" to your master filters line
  const filters = ["All", "Orders", "Invoices", "Deliveries", "System"];

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
        <p className="text-sm text-neutral-500 italic pl-2 pt-4">
          No active records found matching the &quot;{activeFilter}&quot; filter selection.
        </p>
      )}
    </div>
  );
}