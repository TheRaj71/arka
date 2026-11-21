import React from "react";
import { getInvoices } from "@/modules/finance/queries";
import { InvoicesClient } from "./InvoicesClient";

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <InvoicesClient invoices={invoices} />
    </div>
  );
}
