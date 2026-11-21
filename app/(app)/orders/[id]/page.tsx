import React from "react";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { getOrderById } from "@/modules/orders/queries";
import { OrderDetailClient } from "./OrderDetailClient";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const profile = await getProfile();
  const role = profile?.role || "director";

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-2">
      <OrderDetailClient order={order} userRole={role} />
    </div>
  );
}
