import { handlers } from "@/auth";
import { env } from "@/env";

// Sign-in, callback and session endpoints. Not available in AUTH_MODE=local (there is no login).
const notFound = () => Response.json({ error: "not found" }, { status: 404 });

export const GET = env.AUTH_MODE === "github" ? handlers.GET : notFound;
export const POST = env.AUTH_MODE === "github" ? handlers.POST : notFound;
