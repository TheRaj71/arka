import React from "react";
import { getPayments } from "@/modules/orders/queries";
import { PaymentsClient } from "./PaymentsClient";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <PaymentsClient initialPayments={payments} />
    </div>
  );
}
