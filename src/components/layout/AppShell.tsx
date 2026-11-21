"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { type AppRole } from "@/lib/auth/permissions";

interface AppShellProps {
  children: React.ReactNode;
  initialRole?: AppRole;
  userName?: string;
  userEmail?: string;
}

export function AppShell({
  children,
  initialRole = "director",
  userName = "Priya Sharma",
  userEmail = "director@demo.local",
}: AppShellProps) {
  const [role, setRole] = useState<AppRole>(initialRole);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-sky-400 via-sky-200 to-emerald-200 p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans antialiased overflow-x-hidden">
      {/* Dynamic Sun & Atmosphere Lighting Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent_50%)] pointer-events-none" />

      {/* Main Floating Glass Container (Direct Match to Reference Image) */}
      <div className="relative w-full max-w-7xl min-h-[92vh] rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_25px_70px_rgba(0,0,0,0.12)] p-4 sm:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentRole={role}
          userName={userName}
          userEmail={userEmail}
          onRoleChange={(newRole) => setRole(newRole)}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pr-1">
          <Header userName={userName.split(" ")[0]} />
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
