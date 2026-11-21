import React from "react";
import { getTickets, getFaultCodes } from "@/modules/service/queries";
import { ServiceDeskClient } from "./ServiceDeskClient";

export default async function ServicePage() {
  const tickets = await getTickets();
  const faultCodes = await getFaultCodes();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <ServiceDeskClient initialTickets={tickets} faultCodes={faultCodes} />
    </div>
  );
}
