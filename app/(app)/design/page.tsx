import React from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusPill } from "@/components/shared/StatusPill";
import { StepperTracker } from "@/components/shared/StepperTracker";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { ScanInput } from "@/components/ui/ScanInput";
import { HeroHouse3D } from "@/components/3d/HeroHouse3D";
import { RoofSurvey3D } from "@/components/3d/RoofSurvey3D";
import { SystemViewer3D } from "@/components/3d/SystemViewer3D";
import { DigitalTwinCard } from "@/components/3d/DigitalTwinCard";
import { DesignClientGallery } from "./DesignClientGallery";

export const instant = false;

export default async function DesignSystemPage() {
  await connection();

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <PageHeader
        title="Arka Design System & Visual QA"
        description="Comprehensive reference for tokens, typography, operational components, and 3D visualizers."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Design System" },
        ]}
      />

      <DesignClientGallery />
    </div>
  );
}
