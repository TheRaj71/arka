import React from "react";
import { notFound } from "next/navigation";
import { getSurveyById } from "@/modules/surveys/queries";
import { SurveyDetailClient } from "./SurveyDetailClient";

interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = await params;
  const survey = await getSurveyById(id);

  if (!survey) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-2">
      <SurveyDetailClient survey={survey} />
    </div>
  );
}
