import { getProfile } from "@/lib/auth/get-profile";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

async function ForbiddenContent() {
  const profile = await getProfile();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <UserButton />
          </div>
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        </div>

        <div className="space-y-4 text-center text-gray-600">
          <p>You do not have permission to access this page.</p>
          {profile?.role && (
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Your Role:</span>{" "}
                <span className="capitalize">{profile.role}</span>
              </p>
            </div>
          )}
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForbiddenContent />
    </Suspense>
  );
}
