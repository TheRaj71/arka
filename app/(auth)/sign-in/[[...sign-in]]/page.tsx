import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">SunPower Solutions</h1>
          <p className="mt-2 text-gray-600">Solar Installation Management</p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl",
              },
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
