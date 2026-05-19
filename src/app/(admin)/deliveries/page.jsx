"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);

  useEffect(() => {
    fetch("/api/deliveries").then((r) => r.json()).then(setDeliveries).catch(console.error);
  }, []);

  const columns = [
    { key: "id",      header: "Delivery ID" },
    { key: "orderId", header: "Order ID" },
    { key: "courier", header: "Supplier / Courier" },
    { key: "status",  header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "eta",     header: "ETA / Completion" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Deliveries"
        title="Delivery status board"
        description="Monitor delivery progress from supplier updates through completed coffee shop receiving."
      />
      <DataTable columns={columns} rows={deliveries} getRowKey={(row) => row.id} />
    </div>
  );
}
