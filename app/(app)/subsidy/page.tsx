import React from "react";
import { getSubsidyApplications } from "@/modules/finance/queries";
import { SubsidyTrackerClient } from "./SubsidyTrackerClient";

export default async function SubsidyPage() {
  const applications = await getSubsidyApplications();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <SubsidyTrackerClient applications={applications} />
    </div>
  );
}
