import "server-only";
import { getProfile, type AppRole } from "./get-profile";

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require authentication and optionally specific roles
 * Throws AuthError if requirements not met
 * Use in server actions before calling RPC functions
 */
export async function requireRole(
  allowedRoles?: AppRole[]
): Promise<{ profile: NonNullable<Awaited<ReturnType<typeof getProfile>>> }> {
  const profile = await getProfile();

  if (!profile || !profile.is_active) {
    throw new AuthError("UNAUTHENTICATED", "Please sign in.");
  }

  if (!profile.role) {
    throw new AuthError("NO_ROLE", "Your account has no role assigned yet.");
  }

  // Director can do everything
  if (profile.role === "director") {
    return { profile };
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw new AuthError(
      "FORBIDDEN",
      "You do not have permission to perform this action."
    );
  }

  return { profile };
}
