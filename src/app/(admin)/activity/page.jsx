"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/components/edi/ActivityTimeline";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function fetchLogs() {
      try {
        // NEW: Added the cache bypass configuration to the fetch call
        const res = await fetch("/api/activity-logs", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to pull activity logging stream");
        
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Database connection error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Activity Logs"
        title="EDI transaction timeline"
        description="Follow the latest order, invoice, delivery, and inventory updates in one monitoring feed."
      />
      <ActivityTimeline logs={logs} />
    </div>
  );
}