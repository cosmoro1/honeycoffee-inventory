"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/components/edi/ActivityTimeline";

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/activity-logs");
        if (!res.ok) throw new Error("Failed to pull activity logging stream");
        
        const data = await res.json();
        // Force state to be an array even if the network fluctuates
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Database connection error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Container */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Overview
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time transaction tracking and EDI logging infrastructure management dashboard.
        </p>
      </header>

      {/* Main Dashboard Panel Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Feed Area */}
        <div className="lg:col-span-2">
          <ActivityTimeline logs={logs} />
        </div>
        
        {/* Right Column: Information Panel Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/5 h-fit">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Workspace Status
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            All system integrations are online. Monitoring live incoming webhook requests from external trading platforms securely to your Aiven MySQL cloud instance.
          </p>
        </div>
      </div>
    </div>
  );
}