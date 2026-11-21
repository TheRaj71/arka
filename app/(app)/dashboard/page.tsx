import { getProfile } from "@/lib/auth/get-profile";
import { UserButton } from "@clerk/nextjs";
import { Suspense } from "react";
import { redirect } from "next/navigation";

async function DashboardContent() {
  const profile = await getProfile();

  if (!profile || !profile.role) {
    redirect("/pending-role");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {profile.full_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to SunPower Solutions
          </h2>
          <p className="text-gray-600 mb-6">
            Your Clerk authentication is successfully integrated! 🎉
          </p>

          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4">
              <h3 className="font-medium text-green-900 mb-2">✅ Setup Complete</h3>
              <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
                <li>Clerk authentication configured</li>
                <li>Middleware with role-based routing</li>
                <li>Supabase clients (user, admin, browser)</li>
                <li>Auth helpers (getProfile, requireRole)</li>
                <li>Sign-in/sign-up pages</li>
                <li>Webhook handler for user sync</li>
              </ul>
            </div>

            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="font-medium text-blue-900 mb-2">📋 Next Steps</h3>
              <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
                <li>
                  <strong>Configure Clerk Dashboard:</strong>
                  <ul className="ml-4 mt-1 space-y-1 list-disc">
                    <li>Add Supabase integration</li>
                    <li>Customize session token (add app_role)</li>
                    <li>Configure webhook endpoint</li>
                  </ul>
                </li>
                <li>
                  <strong>Set up Supabase schema:</strong> Run migrations from PRD
                </li>
                <li>
                  <strong>Seed demo data:</strong> Settings, products, templates
                </li>
                <li>
                  <strong>Start building features:</strong> Follow IMPLEMENTATION_PLAN.md
                </li>
              </ol>
            </div>

            <div className="rounded-md bg-purple-50 p-4">
              <h3 className="font-medium text-purple-900 mb-2">📚 Documentation</h3>
              <ul className="text-sm text-purple-800 space-y-1 ml-4 list-disc">
                <li>
                  <code className="bg-purple-100 px-1 rounded">IMPLEMENTATION_PLAN.md</code> - Complete
                  implementation guide
                </li>
                <li>
                  <code className="bg-purple-100 px-1 rounded">public/Plan/*.md</code> - PRD files (00-07)
                </li>
                <li>Your role: <strong className="capitalize">{profile.role}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
