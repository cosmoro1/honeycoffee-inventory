"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/components/edi/ActivityTimeline";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/activity-logs").then((r) => r.json()).then(setLogs).catch(console.error);
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