"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then(setOrders).catch(console.error);
  }, []);

  const columns = [
    { key: "id",        header: "Order ID" },
    { key: "items",     header: "Items / Quantity", render: (row) => `${row.items} (${row.quantity} total)` },
    { key: "status",    header: "Status",      render: (row) => <StatusBadge status={row.status} /> },
    { key: "updatedAt", header: "Last Update" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Orders"
        title="EDI order monitoring"
        description="Track incoming coffee shop orders and their supplier confirmation or delivery status."
      />
      <DataTable columns={columns} rows={orders} getRowKey={(row) => row.id} />
    </div>
  );
}
