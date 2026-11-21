import React from "react";
import { notFound } from "next/navigation";
import { getProfile } from "@/lib/auth/get-profile";
import { getQuoteById } from "@/modules/quotes/queries";
import { QuoteDetailClient } from "./QuoteDetailClient";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;
  const profile = await getProfile();
  const role = profile?.role || "director";

  const quote = await getQuoteById(id, role);

  if (!quote) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto py-2">
      <QuoteDetailClient quote={quote} userRole={role} />
    </div>
  );
}
