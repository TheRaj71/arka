import React from "react";
import { JourneyTrackerClient } from "./JourneyTrackerClient";

interface JourneyPageProps {
  params: Promise<{ token: string }>;
}

export default async function JourneyPage({ params }: JourneyPageProps) {
  const { token } = await params;

  return (
    <JourneyTrackerClient
      customerName="Anita Sharma"
      projectNo="PRJ-2627-00001"
      systemKw={3.0}
      stage="installed"
    />
  );
}
