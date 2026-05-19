"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/components/edi/ActivityTimeline";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Fetch activity logs safely by handling wrapped object responses
    fetch("/api/activity-logs")
      .then((r) => r.json())
      .then((data) => {
        if (data && Array.isArray(data.logs)) {
          setLogs(data.logs); // Extracts the array if wrapped in an object { logs: [...] }
        } else if (Array.isArray(data)) {
          setLogs(data);      // Sets it directly if it's a plain array [...]
        }
      })
      .catch(console.error);
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