import React from "react";
import { getOrders } from "@/modules/orders/queries";
import { OrdersClient } from "./OrdersClient";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <OrdersClient initialOrders={orders} />
    </div>
  );
}
