"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/components/edi/ActivityTimeline";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  
  // FIX: Added the missing loading state variables!
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/activity-logs", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Database connection error:", err);
      } finally {
        // This will now successfully execute without crashing
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  // Show a spinner while fetching so the screen doesn't instantly show "Empty"
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

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