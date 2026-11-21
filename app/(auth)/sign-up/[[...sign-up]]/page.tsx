import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";
import { HeroHouse3D } from "@/components/3d/HeroHouse3D";
import { Sun } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--surface-page)] text-text-primary">
      {/* Left Column: Sign Up Form */}
      <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-12 lg:p-16 border-r border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <div>
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
              Create Staff Account
            </h1>
            <p className="text-body-sm text-text-secondary">
              Staff onboarding for SunPower operations: sales engineers, field technicians, warehouse clerks, and accounts.
            </p>
          </div>

          <div className="mt-8">
            <Suspense fallback={<div className="text-body-sm text-text-tertiary">Loading registration...</div>}>
              <SignUp
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

      {/* Right Column: Hero House 3D Simulation */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 bg-[var(--surface-subtle)] relative overflow-hidden">
        <div className="max-w-md space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[var(--radius-control)] bg-[var(--surface-card)] border border-[var(--border-subtle)] text-caption font-mono text-text-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Role-Based Access Control</span>
          </div>
          <h2 className="text-title font-semibold text-text-primary">
            Rooftop Solar Operations Ecosystem
          </h2>
          <p className="text-body-sm text-text-secondary">
            Enabling high-cadence 40 projects/month execution across 15 field technicians with deterministic validation gates.
          </p>
        </div>

        <div className="my-auto py-4">
          <HeroHouse3D height={460} liveKw={3.8} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[var(--border-subtle)] z-10">
          <div>
            <span className="font-mono text-body font-semibold text-text-primary block">
              7 Roles
            </span>
            <span className="text-caption text-text-secondary">
              Strict RBAC enforcement
            </span>
          </div>
          <div>
            <span className="font-mono text-body font-semibold text-text-primary block">
              Offline PWA
            </span>
            <span className="text-caption text-text-secondary">
              IndexedDB rooftop sync
            </span>
          </div>
          <div>
            <span className="font-mono text-body font-semibold text-text-primary block">
              Automations A1-A12
            </span>
            <span className="text-caption text-text-secondary">
              Event-driven pipeline
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
