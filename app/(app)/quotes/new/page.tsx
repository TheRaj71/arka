import React from "react";
import { getPackageTemplates } from "@/modules/quotes/queries";
import { getSurveyById } from "@/modules/surveys/queries";
import { QuoteNewClient } from "./QuoteNewClient";

interface NewQuotePageProps {
  searchParams: Promise<{
    project_id?: string;
    survey_id?: string;
  }>;
}

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const { project_id, survey_id } = await searchParams;
  const templates = await getPackageTemplates();

  let surveyApproved = true;
  let projectNo = "PRJ-2627-00001";
  let customerName = "Anita Sharma";

  if (survey_id) {
    const survey = await getSurveyById(survey_id);
    if (survey) {
      surveyApproved = survey.status === "approved";
      projectNo = survey.project?.project_no || projectNo;
      customerName = survey.project?.customer?.name || customerName;
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-2">
      <QuoteNewClient
        templates={templates}
        projectId={project_id}
        surveyId={survey_id}
        projectNo={projectNo}
        customerName={customerName}
        surveyApproved={surveyApproved}
      />
    </div>
  );
}
