import React from "react";
import { getTechnicianJobs } from "@/modules/field/queries";
import { FieldClient } from "./FieldClient";

export default async function FieldPage() {
  const jobs = await getTechnicianJobs();

  return <FieldClient jobs={jobs} />;
}
