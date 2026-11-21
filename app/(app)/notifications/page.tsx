import React from "react";
import { connection } from "next/server";
import { getProfile } from "@/lib/auth/get-profile";
import { getUserNotifications, getPendingRoleUsers } from "@/modules/users/queries";
import { NotificationsClient } from "./NotificationsClient";

export const instant = false;

export default async function NotificationsPage() {
  await connection();
  const profile = await getProfile();
  if (!profile) return null;

  const [notifications, pendingUsers] = await Promise.all([
    getUserNotifications(profile.id),
    profile.role === "director" ? getPendingRoleUsers() : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-5xl mx-auto py-2">
      <NotificationsClient
        initialNotifications={notifications}
        pendingUsers={pendingUsers}
        isDirector={profile.role === "director"}
      />
    </div>
  );
}
