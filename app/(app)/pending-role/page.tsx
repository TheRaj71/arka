import { getProfile } from "@/lib/auth/get-profile";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function PendingRoleContent() {
  const profile = await getProfile();

  // If they have a role, redirect to dashboard
  if (profile?.role) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <UserButton />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Account Pending Approval
          </h1>
        </div>

        <div className="space-y-4 text-center text-gray-600">
          <p>
            Welcome to SunPower Solutions! Your account has been created, but a
            role has not been assigned yet.
          </p>
          <p>
            Please contact your administrator to assign you a role (Director,
            Manager, Sales, Warehouse, Technician, Support, or Accounts).
          </p>
          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              Your Email: {profile?.email || "Not available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PendingRolePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PendingRoleContent />
    </Suspense>
  );
}
