"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    // 1. Helper function to hit your backend API
    const fetchInventory = () => {
      fetch("/api/inventory")
        .then((r) => r.json())
        .then(setInventory)
        .catch(console.error);
    };

    // Run immediately on mount
    fetchInventory();

    // 2. Poll the API endpoint every 5 seconds for real-time stock sync
    const interval = setInterval(fetchInventory, 5000);

    // Clean up the interval on unmount
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { key: "item",         header: "Item Name" },
    { key: "currentStock", header: "Current Stock", render: (row) => `${row.currentStock} ${row.unit}` },
    { key: "status",       header: "Status",        render: (row) => <StatusBadge status={row.status} /> },
    { key: "lastUpdated",  header: "Last Updated" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Inventory"
        title="Stock visibility"
        description="Watch stock levels affected by EDI deliveries and inventory update messages."
      />
      <DataTable columns={columns} rows={inventory} getRowKey={(row) => row.item} />
    </div>
  );
}