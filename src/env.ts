import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    AUTH_MODE: z.enum(["local", "github"]).default("local"),
    AUTH_SECRET: z.string().optional(),
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
  })
  .refine(
    (e) => e.AUTH_MODE !== "github" || (e.AUTH_SECRET && e.AUTH_GITHUB_ID && e.AUTH_GITHUB_SECRET),
    { message: "AUTH_MODE=github requires AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET" },
  );

export const env = schema.parse(process.env);
