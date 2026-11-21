import React from "react";
import { getSurveys } from "@/modules/surveys/queries";
import { SurveysClient } from "./SurveysClient";

export default async function SurveysPage() {
  const surveys = await getSurveys();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <SurveysClient initialSurveys={surveys} />
    </div>
  );
}
