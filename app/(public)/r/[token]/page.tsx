import React from "react";
import { SharedReportClient } from "./SharedReportClient";

interface SharedReportPageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const { token } = await params;

  return <SharedReportClient />;
}
