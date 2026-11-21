import React from "react";
import { getWarehousePickLists } from "@/modules/inventory/queries";
import { WarehouseClient } from "./WarehouseClient";

export default async function WarehousePage() {
  const pickLists = await getWarehousePickLists();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <WarehouseClient pickLists={pickLists} />
    </div>
  );
}
