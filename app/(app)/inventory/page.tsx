import React from "react";
import { getInventoryCatalogue } from "@/modules/inventory/queries";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const products = await getInventoryCatalogue();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <InventoryClient products={products} />
    </div>
  );
}
