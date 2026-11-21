import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";
import { HeroHouse3D } from "@/components/3d/HeroHouse3D";
import { Zap, ShieldCheck, Sun } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--surface-page)] text-text-primary">
      {/* Left Column: Sign In Form (5 cols on lg) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-r border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div>
          {/* Logo & Product Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent-base)] text-white flex items-center justify-center font-bold text-body">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-text-primary text-title block leading-none">
                Arka
              </span>
              <span className="text-caption text-text-secondary">
                SunPower Solutions ERP
              </span>
            </div>
          </div>

          <div className="mt-12 space-y-2">
            <h1 className="text-title font-semibold text-text-primary">
              Sign in to Operations
            </h1>
            <p className="text-body-sm text-text-secondary">
              Rooftop solar lifecycle management: surveys, quotation, inventory QR dispatch, and 20-year warranty clocks.
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="mt-8">
            <Suspense fallback={<div className="text-body-sm text-text-tertiary">Loading authentication...</div>}>
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border border-[var(--border-subtle)] bg-[var(--surface-card)] rounded-[var(--radius-card)] p-6",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    formButtonPrimary:
                      "bg-[var(--accent-base)] hover:bg-[var(--accent-hover)] text-white h-11 rounded-[var(--radius-control)] text-body font-medium shadow-none transition-colors",
                    formFieldInput:
                      "h-11 rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface-card)] text-text-primary text-body focus:ring-2 focus:ring-[var(--accent-base)]",
                    footerActionLink: "text-[var(--accent-base)] hover:underline font-medium text-body-sm",
                  },
                }}
              />
            </Suspense>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between text-caption text-text-tertiary">
          <span>SunPower Solutions • Punjab & North India</span>
          <span>v2.4.0 High-Performance</span>
        </div>
      </div>

      {/* Right Column: Hero House 3D Simulation (7 cols on lg) */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 bg-[var(--surface-subtle)] relative overflow-hidden">
        <div className="max-w-md space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-control)] bg-[var(--surface-card)] border border-[var(--border-subtle)] text-caption font-mono text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Live Celestial Solar Engine (31° N Latitude)</span>
          </div>
          <h2 className="text-title font-semibold text-text-primary">
            Industrial Solar Infrastructure Platform
          </h2>
          <p className="text-body-sm text-text-secondary">
            Deterministic operations linking physical hardware barcodes on Punjab rooftops to customer asset passports, DISCOM net metering, and PM Surya Ghar subsidies.
          </p>
        </div>

        {/* Live 3D Architectural House Simulation */}
        <div className="my-auto py-4">
          <HeroHouse3D height={460} liveKw={4.2} />
        </div>

        {/* Operational Highlights */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-subtle)] z-10">
          <div>
            <span className="font-mono text-body font-semibold text-text-primary block">
              &lt; 5s SLA
            </span>
            <span className="text-caption text-text-secondary">
              Instant serial warranty lookup
            </span>
          </div>
          <div>
            <span className="font-mono text-body font-semibold text-text-primary block">
              13.8% GST
            </span>
            <span className="text-caption text-text-secondary">
              Statutory 70:30 composite solar split
            </span>
          </div>
          <div>
            <span className="font-mono text-body font-semibold text-text-primary block">
              20-Year Arc
            </span>
            <span className="text-caption text-text-secondary">
              Hardware asset tracking
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
