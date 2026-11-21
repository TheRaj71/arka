import React from "react";
import { getLeads } from "@/modules/leads/queries";
import { LeadsClient } from "@/modules/leads/LeadsClient";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <LeadsClient initialLeads={leads} />
    </div>
  );
}
