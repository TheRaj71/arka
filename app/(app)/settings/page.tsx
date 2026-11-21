import React from "react";
import { connection } from "next/server";
import { getProfile } from "@/lib/auth/get-profile";
import { getPendingRoleUsers, getAllStaffProfiles } from "@/modules/users/queries";
import { SettingsClient } from "./SettingsClient";

export const instant = false;

export default async function SettingsPage() {
  await connection();
  const profile = await getProfile();

  const [pendingUsers, allStaff] = await Promise.all([
    getPendingRoleUsers(),
    getAllStaffProfiles(),
  ]);

  return (
    <div className="max-w-6xl mx-auto py-2">
      <SettingsClient
        initialPendingUsers={pendingUsers}
        initialStaff={allStaff}
        isDirector={profile?.role === "director"}
      />
    </div>
  );
}
