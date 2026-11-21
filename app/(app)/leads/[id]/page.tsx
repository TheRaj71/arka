import React from "react";
import { notFound } from "next/navigation";
import { getLeadById, getActiveTechnicians } from "@/modules/leads/queries";
import { LeadDetailClient } from "@/modules/leads/LeadDetailClient";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const { lead, activities, qualifications } = await getLeadById(id);

  if (!lead) {
    notFound();
  }

  const technicians = await getActiveTechnicians();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <LeadDetailClient
        lead={lead}
        activities={activities}
        qualifications={qualifications}
        technicians={technicians}
      />
    </div>
  );
}
