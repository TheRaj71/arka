import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET || "");

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as unknown as WebhookEvent;
  } catch (err) {
    console.error("Error: Webhook signature verification failed", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  const db = supabaseAdmin();

  try {
    if (eventType === "user.created") {
      const { id, email_addresses, first_name, last_name } = evt.data;
      if (!id) return new Response("Error: Missing user ID", { status: 400 });
      
      const email = email_addresses[0]?.email_address || null;
      const fullName = [first_name, last_name].filter(Boolean).join(" ") || email || "User";

      // Check if this is the bootstrap director
      const isBootstrapDirector =
        email && process.env.BOOTSTRAP_DIRECTOR_EMAIL && email === process.env.BOOTSTRAP_DIRECTOR_EMAIL;

      // Insert profile
      const { error } = await db.from("profiles").upsert(
        {
          clerk_user_id: id,
          email,
          full_name: fullName,
          role: isBootstrapDirector ? "director" : null,
          is_active: true,
        },
        {
          onConflict: "clerk_user_id",
        }
      );

      if (error) throw error;

      // If bootstrap director, update Clerk metadata
      if (isBootstrapDirector) {
        // Note: In production, you'd use Clerk's Backend API to update metadata
        // For now, the middleware will handle this on next sign-in
        console.log(`Bootstrap director account created: ${email}`);
      }

      console.log(`Profile created for user ${id}`);
    } else if (eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name } = evt.data;
      if (!id) return new Response("Error: Missing user ID", { status: 400 });
      
      const email = email_addresses[0]?.email_address || null;
      const fullName = [first_name, last_name].filter(Boolean).join(" ") || email || "User";

      // Update profile (never update role from webhook)
      const { error } = await db
        .from("profiles")
        .update({
          email,
          full_name: fullName,
        })
        .eq("clerk_user_id", id);

      if (error) throw error;

      console.log(`Profile updated for user ${id}`);
    } else if (eventType === "user.deleted") {
      const { id } = evt.data;
      if (!id) return new Response("Error: Missing user ID", { status: 400 });

      // Soft delete
      const { error } = await db
        .from("profiles")
        .update({
          is_active: false,
          deleted_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", id);

      if (error) throw error;

      console.log(`Profile soft-deleted for user ${id}`);
    }

    return new Response("Webhook processed successfully", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error: Failed to process webhook", {
      status: 500,
    });
  }
}
