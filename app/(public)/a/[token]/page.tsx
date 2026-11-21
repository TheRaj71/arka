import React from "react";
import { AssetPassportClient } from "./AssetPassportClient";

interface AssetPassportPageProps {
  params: Promise<{ token: string }>;
}

export default async function AssetPassportPage({ params }: AssetPassportPageProps) {
  const { token } = await params;

  return (
    <AssetPassportClient
      serialNo="SP-INV-2026-0001"
      customerName="Anita Sharma"
      productName="SunPower 3.3 kW Single Phase Inverter"
    />
  );
}
