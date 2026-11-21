import React from "react";
import { getQuotes } from "@/modules/quotes/queries";
import { QuotesClient } from "./QuotesClient";

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div className="max-w-7xl mx-auto py-2">
      <QuotesClient initialQuotes={quotes} />
    </div>
  );
}
