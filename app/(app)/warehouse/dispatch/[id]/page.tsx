import React from "react";
import { notFound } from "next/navigation";
import { getDispatchById } from "@/modules/inventory/queries";
import { DispatchScanClient } from "./DispatchScanClient";

interface DispatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function DispatchPage({ params }: DispatchPageProps) {
  const { id } = await params;
  const dispatch = await getDispatchById(id);

  if (!dispatch) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-2">
      <DispatchScanClient dispatch={dispatch} />
    </div>
  );
}
