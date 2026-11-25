import { eq, sql } from "drizzle-orm";
import { connection } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { env } from "@/env";

/** Fixed id of the single user in AUTH_MODE=local. */
export const LOCAL_USER_ID = "local";

/**
 * The signed-in user, or null if nobody is signed in.
 * In AUTH_MODE=local there is no login: everyone is the local user, created on first use.
 */
export async function getCurrentUser(): Promise<User | null> {
  // With Cache Components, a GET handler that reads no request data is prerendered at build time.
  // The current user is always per request, so opt out explicitly (local mode reads no cookies).
  await connection();

  if (env.AUTH_MODE === "local") return ensureLocalUser();

  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

async function ensureLocalUser(): Promise<User> {
  // One round trip: insert on first use, otherwise return the existing row unchanged.
  const [user] = await db
    .insert(users)
    .values({
      id: LOCAL_USER_ID,
      name: "Local user",
      // Local mode runs on the user's own machine, so its time zone is the user's.
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    .onConflictDoUpdate({ target: users.id, set: { id: sql`excluded.id` } })
    .returning();
  return user;
}

/** JSON 401 response for route handlers. */
export function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
