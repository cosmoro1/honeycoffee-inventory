"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetch("/api/invoices").then((r) => r.json()).then(setInvoices).catch(console.error);
  }, []);

  const columns = [
    { key: "id",       header: "Invoice ID" },
    { key: "orderId",  header: "Order Reference" },
    { key: "amount",   header: "Amount" },
    { key: "status",   header: "Status",    render: (row) => <StatusBadge status={row.status} /> },
    { key: "issuedAt", header: "Issued At" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Invoices"
        title="Invoice status monitoring"
        description="Review generated invoices and payment status linked to EDI orders."
      />
      <DataTable columns={columns} rows={invoices} getRowKey={(row) => row.id} />
    </div>
  );
}
