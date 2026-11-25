import type { MeResponse } from "@/contracts/me";
import { env } from "@/env";
import { getCurrentUser } from "@/server/current-user";
import { unauthorized } from "@/server/http";

/** GET /api/me: the current user and their settings, or 401. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  return Response.json({
    id: user.id,
    name: user.name,
    image: user.image,
    timezone: user.timezone,
    dayStartHour: user.dayStartHour,
    dailyGoal: user.dailyGoal,
    authMode: env.AUTH_MODE,
  } satisfies MeResponse);
}
