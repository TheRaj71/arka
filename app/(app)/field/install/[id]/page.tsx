import React from "react";
import { notFound } from "next/navigation";
import { getInstallJobById } from "@/modules/field/queries";
import { InstallFormClient } from "./InstallFormClient";

interface InstallPageProps {
  params: Promise<{ id: string }>;
}

export default async function InstallPage({ params }: InstallPageProps) {
  const { id } = await params;
  const job = await getInstallJobById(id);

  if (!job) {
    notFound();
  }

  return <InstallFormClient job={job} />;
}
