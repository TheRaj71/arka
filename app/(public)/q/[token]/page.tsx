import React from "react";
import { notFound } from "next/navigation";
import { getQuoteByToken } from "@/modules/quotes/queries";
import { PublicQuoteClient } from "./PublicQuoteClient";

interface PublicQuotePageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { token } = await params;
  const { quote, valid } = await getQuoteByToken(token);

  if (!quote || !valid) {
    notFound();
  }

  return <PublicQuoteClient quote={quote} token={token} />;
}
