import { z } from "zod";

// Request/response shapes shared by the API, the web UI and (later) the Chrome extension.

export const meResponse = z.object({
  id: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  timezone: z.string(),
  dayStartHour: z.number().int(),
  dailyGoal: z.number().int(),
  authMode: z.enum(["local", "github"]),
});

export type MeResponse = z.infer<typeof meResponse>;
